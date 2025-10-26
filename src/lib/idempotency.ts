import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { prisma } from './prisma';
import { asyncHandler } from './asyncHandler';

export function idempotencyMiddleware() {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const key = req.headers['idempotency-key'] as string | undefined;

      // Idempotency-Key header is optional for dev/test convenience
      if (!key) {
        return next();
      }

      // Production enforcement (currently disabled for dev convenienc):
      // if (!key) {
      //   return res.status(400).json({
      //     error: 'Idempotency-Key header is required'
      //   });
      // }

      const existing = await prisma.idempotencyKey.findUnique({
        where: { key }
      });

      if (existing) {
        if (existing.expiresAt < new Date()) {
          await prisma.idempotencyKey.delete({ where: { key } });
        } else {
          logger.info({ key }, 'Returning cached idempotent response');
          res.setHeader('Idempotency-Key', key);
          return res
            .status(existing.statusCode)
            .json(JSON.parse(existing.body));
        }
      }

      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        res.setHeader('Idempotency-Key', key);

        prisma.idempotencyKey
          .create({
            data: {
              key,
              statusCode: res.statusCode,
              body: JSON.stringify(body),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          })
          .then(() => logger.info({ key }, 'Stored idempotent response'))
          .catch((err) =>
            logger.error({ key, err }, 'Error storing idempotency key')
          );

        return originalJson(body);
      };

      return next();
    }
  );
}

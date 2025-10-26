import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { ZodError } from 'zod';
import { NotFoundError, BusinessRuleError, ConflictError } from './errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof NotFoundError) {
    logger.debug({ path: req.path }, 'Not found');
    return res.status(404).json({ error: err.message });
  }

  if (err instanceof BusinessRuleError) {
    logger.debug({ path: req.path }, 'Business rule violation');
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof ConflictError) {
    logger.debug({ path: req.path }, 'Conflict');
    return res.status(409).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    logger.debug(
      { path: req.path, validationErrors: err.errors },
      'Validation error'
    );
    return res.status(400).json({
      error: 'Invalid request data',
      details: err.errors
    });
  }

  // Handle Prisma ORM error codes
  // P2002: Unique constraint violation (e.g., duplicate email)
  // P2025: Record not found in database
  // P2014: Required relation missing (foreign key constraint)
  // - See: https://www.prisma.io/docs/orm/reference/error-reference
  if (err && typeof err === 'object' && 'code' in err) {
    const code = err.code as string;

    if (code === 'P2002') {
      logger.warn({ code }, 'Unique constraint violation');
      return res.status(409).json({ error: 'Resource already exists' });
    }

    if (code === 'P2025') {
      logger.warn({ code }, 'Record not found in database');
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (code === 'P2014') {
      logger.warn({ code }, 'Required relation missing');
      return res.status(400).json({ error: 'Required relation missing' });
    }
  }

  // Log unexpected errors (internal server errors)
  logger.error(
    { err, path: req.path, method: req.method },
    'Unexpected error in request'
  );

  return res.status(500).json({
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'production' ? undefined : err.message
  });
}

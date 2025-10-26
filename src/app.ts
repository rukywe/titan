import express from 'express';
import { securityMiddleware } from './middleware/security';
import { prisma } from './lib/prisma';
import { errorHandler } from './lib/errorHandler';
import { fundsRouter } from './routes/funds';
import { investorsRouter } from './routes/investors';
import { investmentsRouter } from './routes/investments';

const app = express();

app.use(securityMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_, res) =>
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
);

app.get('/health/db', async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/funds', fundsRouter);
app.use('/investors', investorsRouter);
app.use('/funds', investmentsRouter);

app.use('*', (req, res) =>
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  })
);

app.use(errorHandler);

export default app;

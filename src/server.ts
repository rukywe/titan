import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
  logger.info('');
  logger.info('Available Endpoints:');
  logger.info('  GET  /health                - Health check');
  logger.info('  GET  /health/db             - Database health check');
  logger.info('  GET  /funds                 - List all funds');
  logger.info('  POST /funds                 - Create fund');
  logger.info('  PUT  /funds                 - Update fund');
  logger.info('  GET  /funds/:id             - Get fund by ID');
  logger.info('  GET  /investors              - List all investors');
  logger.info('  POST /investors             - Create investor');
  logger.info('  GET  /funds/:fund_id/investments - List investments');
  logger.info('  POST /funds/:fund_id/investments - Create investment');
  logger.info('');
  logger.info(`Health: http://localhost:${env.PORT}/health`);
  logger.info(`Database: http://localhost:${env.PORT}/health/db`);
});

const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');

  server.close(async () => {
    logger.info('HTTP server closed');

    await prisma.$disconnect();
    logger.info('Database disconnected');

    logger.info('Process terminated');
    process.exit(0);
  });

  setTimeout(() => {
    logger.warn('Force closing server');
    process.exit(1);
  }, 2000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('SIGHUP', gracefulShutdown);

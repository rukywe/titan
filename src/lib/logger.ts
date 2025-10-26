import pino from 'pino';

const isDevelopment = process.env['NODE_ENV'] === 'development';

const loggerConfig = {
  level: isDevelopment ? 'debug' : 'info',
  formatters: {
    level: (label: string) => ({ level: label })
  }
} as const;

if (isDevelopment) {
  (loggerConfig as any).transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  };
}

export const logger = pino(loggerConfig);

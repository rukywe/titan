import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: false
  }),
  cors({
    origin: process.env['FRONTEND_URL'] || '*',
    credentials: true
  })
];

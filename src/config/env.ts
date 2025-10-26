import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production']).default('development')
});

export const env = envSchema.parse(process.env);

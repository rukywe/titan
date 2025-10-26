import { z } from 'zod';

export const fundStatusSchema = z.enum(['Fundraising', 'Investing', 'Closed']);

export const investorTypeSchema = z.enum([
  'Individual',
  'Institution',
  'Family Office'
]);

export const fundCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  vintage_year: z.number().int().min(1900).max(2100),
  target_size_usd: z.number().positive('Target size must be positive'),
  status: fundStatusSchema.optional().default('Fundraising')
});

export const fundUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  vintage_year: z.number().int().min(1900).max(2100),
  target_size_usd: z.number().positive('Target size must be positive'),
  status: fundStatusSchema
});

export const investorCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  investor_type: investorTypeSchema,
  email: z.string().email('Invalid email address')
});

export const investmentCreateSchema = z.object({
  investor_id: z.string().uuid('Invalid investor ID'),
  amount_usd: z.number().positive('Amount must be positive'),
  investment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
});

export const uuidParamSchema = z.object({
  id: z.string().uuid()
});

export const fundIdParamSchema = z.object({
  fund_id: z.string().uuid()
});

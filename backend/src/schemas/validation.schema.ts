import { z } from 'zod';

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .min(1, 'Email cannot be empty')
      .max(254, 'Email cannot exceed 254 characters'),
  }),
});

export const verifyQuerySchema = z.object({
  query: z.object({
    email: z
      .string({ required_error: 'Email query parameter is required' })
      .min(1, 'Email cannot be empty')
      .max(254, 'Email cannot exceed 254 characters'),
  }),
});

export const createJobSchema = z.object({
  body: z.object({
    emails: z
      .array(z.string().min(1, 'Email in list cannot be empty'))
      .min(1, 'Emails list must contain at least 1 email')
      .max(10000, 'Cannot exceed 10,000 emails per job'),
    filename: z.string().optional(),
  }),
});

export const getJobParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid job ID format'),
  }),
});

export const getJobItemsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid job ID format'),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    status: z.enum(['valid', 'risky', 'invalid', 'error', 'pending', 'all']).optional(),
  }),
});

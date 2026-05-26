import { z } from 'zod';

const ALLOWED_CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'] as const;

export const referralSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian mobile number'),
  city: z.enum(ALLOWED_CITIES, {
    errorMap: () => ({ message: `City must be one of: ${ALLOWED_CITIES.join(', ')}` }),
  }),
  job_id: z.number().int().positive('job_id must be a positive integer'),
});

export type ReferralInput = z.infer<typeof referralSchema>;

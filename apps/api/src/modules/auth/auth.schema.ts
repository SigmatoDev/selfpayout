import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['SUPER_ADMIN', 'RETAILER_ADMIN', 'RETAILER_STAFF']).optional()
});

export type LoginInput = z.infer<typeof loginSchema>;

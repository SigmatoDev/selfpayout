import { z } from 'zod';

export const customerSchema = z.object({
  retailerId: z.string().uuid(),
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional(),
  notes: z.string().optional()
});

export type CustomerInput = z.infer<typeof customerSchema>;

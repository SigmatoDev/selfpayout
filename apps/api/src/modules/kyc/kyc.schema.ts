import { z } from 'zod';

export const kycUpdateSchema = z.object({
  retailerId: z.string().uuid(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  comments: z.string().optional()
});

export type KycUpdateInput = z.infer<typeof kycUpdateSchema>;

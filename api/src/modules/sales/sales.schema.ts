import { z } from 'zod';

export const salesSummaryQuerySchema = z.object({
  retailerId: z.string().uuid(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

import { z } from 'zod';

export const subscriptionPlanSchema = z.object({
  name: z.string().min(2),
  price: z.number().nonnegative(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  features: z.array(z.string()).default([]),
  active: z.boolean().default(true)
});

export const subscriptionAssignSchema = z.object({
  planId: z.string().uuid(),
  retailerId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;
export type SubscriptionAssignInput = z.infer<typeof subscriptionAssignSchema>;

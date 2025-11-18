import { z } from 'zod';

export const paymentLinkSchema = z.object({
  retailerId: z.string().uuid(),
  planId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  email: z.string().email(),
  phone: z.string().min(8)
});

export const paymentWebhookSchema = z.object({
  event: z.string(),
  payload: z.any()
});

export const paymentRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive().optional(),
  reason: z.string().optional()
});

export type PaymentLinkInput = z.infer<typeof paymentLinkSchema>;
export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;
export type PaymentRefundInput = z.infer<typeof paymentRefundSchema>;

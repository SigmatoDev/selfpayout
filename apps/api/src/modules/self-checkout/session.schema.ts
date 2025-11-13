import { z } from 'zod';

const storeTypeEnum = z.enum(['KIRANA', 'RESTAURANT', 'TRAIN']);

export const sessionStartSchema = z.object({
  retailerCode: z.string().min(3),
  customerPhone: z.string().min(8).optional(),
  storeType: storeTypeEnum.default('KIRANA'),
  context: z.record(z.string(), z.string()).optional()
});

export const sessionItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  taxPercentage: z.number().min(0).max(28).default(0)
});

export const sessionItemIdSchema = z.object({
  itemId: z.string().uuid()
});

export const sessionSubmitSchema = z.object({
  paymentMode: z.enum(['CASH', 'UPI', 'CARD']).optional()
});

export const sessionVerifySchema = z.object({
  guardId: z.string().optional()
});

export const sessionListSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'SUBMITTED', 'PAID', 'APPROVED', 'CANCELLED']).optional(),
  retailerId: z.string().uuid().optional(),
  storeType: storeTypeEnum.optional()
});

export const sessionPaymentSchema = z.object({
  paymentMode: z.enum(['CASH', 'UPI', 'CARD']).default('UPI'),
  notes: z.string().optional(),
  retailerId: z.string().uuid().optional()
});

export type SessionStartInput = z.infer<typeof sessionStartSchema>;
export type SessionItemInput = z.infer<typeof sessionItemSchema>;
export type SessionItemIdInput = z.infer<typeof sessionItemIdSchema>;
export type SessionSubmitInput = z.infer<typeof sessionSubmitSchema>;
export type SessionVerifyInput = z.infer<typeof sessionVerifySchema>;
export type SessionListInput = z.infer<typeof sessionListSchema>;
export type SessionPaymentInput = z.infer<typeof sessionPaymentSchema>;

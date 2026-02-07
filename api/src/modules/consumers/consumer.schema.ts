import { z } from 'zod';

export const consumerOtpRequestSchema = z.object({
  phone: z.string().min(8)
});

export const consumerOtpVerifySchema = z.object({
  phone: z.string().min(8),
  otp: z.string().min(4)
});

export const consumerProfileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.preprocess((value) => (value === null ? undefined : value), z.string().url().optional()),
  address: z.string().min(4).optional(),
  notificationsEnabled: z.boolean().optional()
});

export type ConsumerOtpRequestInput = z.infer<typeof consumerOtpRequestSchema>;
export type ConsumerOtpVerifyInput = z.infer<typeof consumerOtpVerifySchema>;
export type ConsumerProfileUpdateInput = z.infer<typeof consumerProfileUpdateSchema>;

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['SUPER_ADMIN', 'RETAILER_ADMIN', 'RETAILER_STAFF']).optional()
});

export const otpLoginSchema = z.object({
  phone: z.string().min(6),
  otp: z.string().min(4),
  role: z.enum(['RETAILER_ADMIN', 'RETAILER_STAFF']).optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type OtpLoginInput = z.infer<typeof otpLoginSchema>;

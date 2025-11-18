import { z } from 'zod';

const languageEnum = z.enum(['en', 'hi', 'ka']);

export const retailerCreateSchema = z.object({
  name: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(8),
  shopName: z.string().min(2),
  address: z.string().min(5),
  gstEnabled: z.boolean().default(false),
  gstNumber: z.string().optional(),
  subscriptionPlanId: z.string().uuid(),
  languagePreference: languageEnum.default('en'),
  temporaryPassword: z.string().min(8).optional()
});

export const retailerUpdateSchema = retailerCreateSchema.extend({
  temporaryPassword: z.string().min(8).optional()
}).partial();

export const retailerQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  search: z.string().optional()
});

const documentFileSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  data: z.string().min(1)
});

export const retailerSignupSchema = z.object({
  ownerName: z.string().min(2),
  shopName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(8),
  address: z.string().min(5),
  gstEnabled: z.boolean().default(false),
  gstNumber: z.string().optional(),
  languagePreference: languageEnum.default('en'),
  subscriptionPlanId: z.string().uuid().optional(),
  aadharNumber: z.string().min(6),
  panNumber: z.string().min(5),
  documents: z.object({
    aadhar: documentFileSchema,
    pan: documentFileSchema
  })
});

export type RetailerCreateInput = z.infer<typeof retailerCreateSchema>;
export type RetailerUpdateInput = z.infer<typeof retailerUpdateSchema>;
export type RetailerSignupInput = z.infer<typeof retailerSignupSchema>;

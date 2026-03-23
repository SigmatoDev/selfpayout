import { z } from 'zod';

const languageEnum = z.enum(['en', 'hi', 'ka']);
const storeTypeEnum = z.enum(['KIRANA', 'RESTAURANT', 'TRAIN']);
const retailerSettingsSchema = z.object({
  selfBillingEnabled: z.boolean().optional(),
  marketplaceEnabled: z.boolean().optional(),
  tableOrderingEnabled: z.boolean().optional(),
  deliveryOrderingEnabled: z.boolean().optional(),
  tokenOrderingEnabled: z.boolean().optional(),
  ticketingEnabled: z.boolean().optional()
});
const documentFileSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  data: z.string().min(1)
});

export const retailerCreateSchema = z.object({
  name: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(8),
  shopName: z.string().min(2),
  address: z.string().min(5),
  storeType: storeTypeEnum.default('RESTAURANT'),
  fssaiNumber: z.string().optional(),
  serviceChargePct: z.number().min(0).max(25).default(0),
  gstEnabled: z.boolean().default(false),
  gstNumber: z.string().optional(),
  subscriptionPlanId: z.string().uuid(),
  languagePreference: languageEnum.default('en'),
  aadharNumber: z.string().min(6).optional(),
  panNumber: z.string().min(5).optional(),
  documents: z.object({
    aadhar: documentFileSchema.optional(),
    pan: documentFileSchema.optional()
  }).optional(),
  settings: retailerSettingsSchema.optional(),
  temporaryPassword: z.string().min(8).optional()
});

export const retailerUpdateSchema = retailerCreateSchema.extend({
  temporaryPassword: z.string().min(8).optional()
}).partial();

export const retailerQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  search: z.string().optional()
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
  storeType: storeTypeEnum.default('RESTAURANT'),
  fssaiNumber: z.string().optional(),
  serviceChargePct: z.number().min(0).max(25).default(0),
  subscriptionPlanId: z.string().uuid().optional(),
  aadharNumber: z.string().min(6),
  panNumber: z.string().min(5),
  password: z.string().min(8),
  documents: z.object({
    aadhar: documentFileSchema,
    pan: documentFileSchema
  })
});

export type RetailerCreateInput = z.infer<typeof retailerCreateSchema>;
export type RetailerUpdateInput = z.infer<typeof retailerUpdateSchema>;
export type RetailerSignupInput = z.infer<typeof retailerSignupSchema>;

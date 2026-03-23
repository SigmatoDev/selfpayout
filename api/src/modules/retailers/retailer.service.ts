import { randomBytes } from 'crypto';

import bcrypt from 'bcryptjs';

import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { uploadObject } from '../../lib/storage.js';
import type { RetailerCreateInput, RetailerSignupInput, RetailerUpdateInput } from './retailer.schema.js';

const TEMP_PASSWORD_BYTES = 9;
const BCRYPT_ROUNDS = 10;

const generateTemporaryPassword = () => {
  const raw = randomBytes(TEMP_PASSWORD_BYTES).toString('base64');
  return raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
};

const hashPassword = async (plaintext: string) => bcrypt.hash(plaintext, BCRYPT_ROUNDS);
const RETAILER_CODE_PREFIX = 'RET';
const RETAILER_CODE_PAD = 4;
const nextRetailerCode = async () => {
  const sequence = await prisma.sequence.upsert({
    where: { key: 'retailer' },
    create: { key: 'retailer', value: 1 },
    update: { value: { increment: 1 } }
  });

  return `${RETAILER_CODE_PREFIX}${String(sequence.value).padStart(RETAILER_CODE_PAD, '0')}`;
};
const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'retailer';

type StoreType = 'KIRANA' | 'RESTAURANT' | 'TRAIN';

type RetailerFeatureSettings = {
  selfBillingEnabled: boolean;
  marketplaceEnabled: boolean;
  tableOrderingEnabled: boolean;
  deliveryOrderingEnabled: boolean;
  tokenOrderingEnabled: boolean;
  ticketingEnabled: boolean;
};

const defaultFeatureSettings = (storeType: StoreType): RetailerFeatureSettings => {
  switch (storeType) {
    case 'KIRANA':
      return {
        selfBillingEnabled: true,
        marketplaceEnabled: true,
        tableOrderingEnabled: false,
        deliveryOrderingEnabled: false,
        tokenOrderingEnabled: false,
        ticketingEnabled: false
      };
    case 'TRAIN':
      return {
        selfBillingEnabled: false,
        marketplaceEnabled: false,
        tableOrderingEnabled: false,
        deliveryOrderingEnabled: false,
        tokenOrderingEnabled: false,
        ticketingEnabled: true
      };
    default:
      return {
        selfBillingEnabled: false,
        marketplaceEnabled: false,
        tableOrderingEnabled: true,
        deliveryOrderingEnabled: true,
        tokenOrderingEnabled: false,
        ticketingEnabled: false
      };
  }
};

const mergeFeatureSettings = (
  storeType: StoreType,
  input?: Partial<RetailerFeatureSettings> | null
) => {
  const merged = {
    ...defaultFeatureSettings(storeType),
    ...(input ?? {})
  };

  if (merged.tokenOrderingEnabled) {
    merged.tableOrderingEnabled = false;
  } else if (input?.tableOrderingEnabled == true) {
    merged.tokenOrderingEnabled = false;
  }

  return merged;
};

const pickFeatureSettings = (
  settings?: Partial<RetailerFeatureSettings> | null
): Partial<RetailerFeatureSettings> => ({
  selfBillingEnabled: settings?.selfBillingEnabled,
  marketplaceEnabled: settings?.marketplaceEnabled,
  tableOrderingEnabled: settings?.tableOrderingEnabled,
  deliveryOrderingEnabled: settings?.deliveryOrderingEnabled,
  tokenOrderingEnabled: settings?.tokenOrderingEnabled,
  ticketingEnabled: settings?.ticketingEnabled
});

const persistSignupDocument = async (
  shopName: string,
  type: 'aadhar' | 'pan',
  file: RetailerSignupInput['documents']['aadhar']
) => {
  const buffer = Buffer.from(file.data, 'base64');
  const extensionMatch = file.fileName.match(/\\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch ? `.${extensionMatch[1].toLowerCase()}` : '';
  const filename = `${type}-${Date.now()}${extension}`;
  const result = await uploadObject({
    buffer,
    filename,
    prefix: `uploads/${slugify(shopName)}`,
    contentType: file.contentType
  });

  return {
    storageKey: result.key,
    storageProvider: result.provider,
    location: result.location,
    originalName: file.fileName,
    contentType: file.contentType,
    size: buffer.byteLength
  };
};

export const listRetailers = async (params: { status?: string; search?: string }) => {
  const { status, search } = params;

  return (prisma.retailer as any).findMany({
    where: {
      status: status as 'ACTIVE' | 'SUSPENDED' | undefined,
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { shopName: { contains: search, mode: 'insensitive' } }
          ]
        : undefined
    },
    include: {
      subscription: { include: { plan: true } },
      kyc: true,
      settings: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const listPublicRetailers = async () => {
  return prisma.retailer.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      shopName: true,
      storeType: true,
      settings: {
        select: {
          selfBillingEnabled: true,
          marketplaceEnabled: true,
          tableOrderingEnabled: true,
          deliveryOrderingEnabled: true,
          tokenOrderingEnabled: true,
          ticketingEnabled: true
        }
      }
    },
    orderBy: { shopName: 'asc' }
  });
};

export const createRetailer = async (input: RetailerCreateInput) => {
  const { temporaryPassword, settings, documents, aadharNumber, panNumber, ...data } = input;
  const existingRetailer = await prisma.retailer.findFirst({
    where: {
      OR: [
        { contactEmail: data.contactEmail },
        { contactPhone: data.contactPhone },
        { shopName: data.shopName }
      ]
    },
    select: { id: true, contactEmail: true, contactPhone: true, shopName: true }
  });

  if (existingRetailer) {
    const error = new Error('A retailer with this email, phone, or shop name already exists');
    error.name = 'ConflictError';
    throw error;
  }

  const generatedPassword = temporaryPassword ?? generateTemporaryPassword();
  const passwordHash = await hashPassword(generatedPassword);
  const retailerCode = await nextRetailerCode();
  const featureSettings = mergeFeatureSettings(data.storeType as StoreType, settings);
  const aadharFile = documents?.aadhar
    ? await persistSignupDocument(data.shopName, 'aadhar', documents.aadhar)
    : null;
  const panFile = documents?.pan
    ? await persistSignupDocument(data.shopName, 'pan', documents.pan)
    : null;
  const kycDocuments =
    aadharFile || panFile
      ? {
          ...(aadharFile
            ? {
                aadhar: {
                  number: aadharNumber ?? null,
                  file: aadharFile
                }
              }
            : {}),
          ...(panFile
            ? {
                pan: {
                  number: panNumber ?? null,
                  file: panFile
                }
              }
            : {})
        }
      : undefined;

  const retailer = await (prisma.retailer as any).create({
    data: {
      ...data,
      retailerCode,
      status: 'PENDING_ONBOARDING',
      users: {
        create: {
          name: data.name,
          email: data.contactEmail,
          role: 'RETAILER_ADMIN',
          passwordHash
        }
      },
      settings: {
        create: {
          storageProvider: env.STORAGE_PROVIDER,
          storageBucket: env.S3_BUCKET,
          storageRegion: env.S3_REGION,
          storagePathPrefix: data.shopName.toLowerCase().replace(/\s+/g, '-'),
          ...featureSettings
        }
      },
      kyc: {
        create: {
          status: 'PENDING',
          documents: kycDocuments
        }
      }
    },
    include: { users: true, settings: true }
  });

  return {
    retailer,
    temporaryPassword: generatedPassword
  };
};

export const submitRetailerOnboarding = async (input: RetailerSignupInput) => {
  const existingRetailer = await prisma.retailer.findFirst({
    where: {
      OR: [
        { contactEmail: input.contactEmail },
        { contactPhone: input.contactPhone },
        { shopName: input.shopName }
      ]
    },
    select: { id: true }
  });

  if (existingRetailer) {
    const error = new Error('An application already exists for this retailer');
    error.name = 'ConflictError';
    throw error;
  }

  const [aadharFile, panFile] = await Promise.all([
    persistSignupDocument(input.shopName, 'aadhar', input.documents.aadhar),
    persistSignupDocument(input.shopName, 'pan', input.documents.pan)
  ]);

  const passwordHash = await hashPassword(input.password);
  const retailerCode = await nextRetailerCode();
  const featureSettings = mergeFeatureSettings((input.storeType ?? 'RESTAURANT') as StoreType);

  const retailer = await (prisma.retailer as any).create({
    data: {
      retailerCode,
      name: input.ownerName,
      shopName: input.shopName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      address: input.address,
      gstEnabled: input.gstEnabled,
      gstNumber: input.gstNumber ?? null,
      languagePreference: input.languagePreference,
      storeType: input.storeType ?? 'RESTAURANT',
      fssaiNumber: input.fssaiNumber ?? null,
      serviceChargePct: input.serviceChargePct ?? 0,
      subscriptionPlanId: input.subscriptionPlanId ?? null,
      status: 'PENDING_ONBOARDING',
      users: {
        create: {
          name: input.ownerName,
          email: input.contactEmail,
          role: 'RETAILER_ADMIN',
          passwordHash
        }
      },
      settings: {
        create: {
          storageProvider: env.STORAGE_PROVIDER,
          storageBucket: env.S3_BUCKET,
          storageRegion: env.S3_REGION,
          storagePathPrefix: input.shopName.toLowerCase().replace(/\s+/g, '-'),
          ...featureSettings
        }
      },
      kyc: {
        create: {
          status: 'PENDING',
          documents: {
            aadhar: {
              number: input.aadharNumber,
              file: aadharFile
            },
            pan: {
              number: input.panNumber,
              file: panFile
            }
          }
        }
      }
    },
    select: { id: true, retailerCode: true, status: true, createdAt: true }
  });

  return retailer;
};

const rotateRetailerPassword = async (retailerId: string, newPassword: string) => {
  const admin = await prisma.user.findFirst({
    where: { retailerId, role: 'RETAILER_ADMIN' },
    orderBy: { createdAt: 'asc' }
  });

  if (!admin) {
    return null;
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash }
  });

  return admin.id;
};

export const updateRetailer = async (id: string, input: RetailerUpdateInput) => {
  const { temporaryPassword, settings, ...data } = input;
  let issuedPassword: string | undefined;

  if (temporaryPassword) {
    await rotateRetailerPassword(id, temporaryPassword);
    issuedPassword = temporaryPassword;
  }

  const existingRetailer = await (prisma.retailer as any).findUnique({
    where: { id },
    include: { settings: true }
  });

  if (!existingRetailer) {
    const error = new Error('Retailer not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const nextStoreType = (data.storeType ?? existingRetailer.storeType) as StoreType;
  const mergedSettings = settings
    ? mergeFeatureSettings(nextStoreType, {
        ...pickFeatureSettings(existingRetailer.settings),
        ...pickFeatureSettings(settings)
      })
    : undefined;

  const retailer = await (prisma.retailer as any).update({
    where: { id },
    data: {
      ...data,
      settings: mergedSettings
        ? {
            upsert: {
              update: mergedSettings,
              create: {
                ...mergeFeatureSettings(nextStoreType, mergedSettings),
                storageProvider: existingRetailer.settings?.storageProvider ?? env.STORAGE_PROVIDER,
                storageBucket: existingRetailer.settings?.storageBucket ?? env.S3_BUCKET,
                storageRegion: existingRetailer.settings?.storageRegion ?? env.S3_REGION,
                storagePathPrefix:
                  existingRetailer.settings?.storagePathPrefix ??
                  existingRetailer.shopName.toLowerCase().replace(/\s+/g, '-')
              }
            }
          }
        : undefined
    },
    include: { subscription: { include: { plan: true } }, kyc: true, settings: true }
  });

  return {
    retailer,
    temporaryPassword: issuedPassword
  };
};

export const disableRetailer = async (id: string) => {
  return prisma.retailer.update({
    where: { id },
    data: { status: 'SUSPENDED' }
  });
};

export const enableRetailer = async (id: string) => {
  return prisma.retailer.update({
    where: { id },
    data: { status: 'ACTIVE' }
  });
};

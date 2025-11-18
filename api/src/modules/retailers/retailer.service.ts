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
const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'retailer';

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

export const createRetailer = async (input: RetailerCreateInput) => {
  const { temporaryPassword, ...data } = input;
  const generatedPassword = temporaryPassword ?? generateTemporaryPassword();
  const passwordHash = await hashPassword(generatedPassword);

  const retailer = await (prisma.retailer as any).create({
    data: {
      ...data,
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
          storagePathPrefix: data.shopName.toLowerCase().replace(/\s+/g, '-')
        }
      },
      kyc: {
        create: {
          status: 'PENDING'
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

  const retailer = await (prisma.retailer as any).create({
    data: {
      name: input.ownerName,
      shopName: input.shopName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      address: input.address,
      gstEnabled: input.gstEnabled,
      gstNumber: input.gstNumber ?? null,
      languagePreference: input.languagePreference,
      subscriptionPlanId: input.subscriptionPlanId ?? null,
      status: 'PENDING_ONBOARDING',
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
    select: { id: true, status: true, createdAt: true }
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
  const { temporaryPassword, ...data } = input;
  let issuedPassword: string | undefined;

  if (temporaryPassword) {
    await rotateRetailerPassword(id, temporaryPassword);
    issuedPassword = temporaryPassword;
  }

  const retailer = await (prisma.retailer as any).update({
    where: { id },
    data,
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

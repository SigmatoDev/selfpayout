import { randomBytes } from 'crypto';

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

import { env } from '../src/config/env';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

const generatePassword = () =>
  randomBytes(9)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 12);

async function ensureSuperAdmin() {
  const email = env.SUPER_ADMIN_EMAIL;
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (env.SUPER_ADMIN_PASSWORD) {
      const hash = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, BCRYPT_ROUNDS);
      await prisma.user.update({
        where: { email },
        data: { passwordHash: hash, role: 'SUPER_ADMIN', name: existing.name ?? 'Platform Admin' }
      });
      return { email, password: env.SUPER_ADMIN_PASSWORD, regenerated: true };
    }

    return { email, password: undefined, regenerated: false };
  }

  const password = env.SUPER_ADMIN_PASSWORD ?? generatePassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      email,
      name: 'Platform Admin',
      passwordHash,
      role: 'SUPER_ADMIN'
    }
  });

  return { email, password, regenerated: true };
}

async function getOrCreatePlan(name: string, price: number, billingCycle: 'MONTHLY' | 'YEARLY', features: string[]) {
  const existing = await prisma.subscriptionPlan.findFirst({ where: { name } });
  if (existing) {
    return existing;
  }

  return prisma.subscriptionPlan.create({
    data: {
      name,
      price,
      billingCycle,
      features,
      active: true
    }
  });
}

async function seedRetailer(opts: {
  name: string;
  shopName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  gstEnabled: boolean;
  gstNumber?: string;
  languagePreference: 'en' | 'hi' | 'ka';
  planId: string;
  status: 'ACTIVE' | 'PENDING_ONBOARDING' | 'SUSPENDED';
  adminPassword: string;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}) {
  const existing = await prisma.retailer.findUnique({ where: { contactEmail: opts.contactEmail } });
  if (existing) {
    return existing;
  }

  const passwordHash = await bcrypt.hash(opts.adminPassword, BCRYPT_ROUNDS);

  const retailer = await prisma.retailer.create({
    data: {
      name: opts.name,
      shopName: opts.shopName,
      contactEmail: opts.contactEmail,
      contactPhone: opts.contactPhone,
      address: opts.address,
      gstEnabled: opts.gstEnabled,
      gstNumber: opts.gstNumber,
      languagePreference: opts.languagePreference,
      subscriptionPlanId: opts.planId,
      status: opts.status,
      users: {
        create: {
          name: opts.name,
          email: opts.contactEmail,
          role: 'RETAILER_ADMIN',
          passwordHash
        }
      },
      settings: {
        create: {
          storageProvider: env.STORAGE_PROVIDER,
          storageBucket: env.S3_BUCKET,
          storageRegion: env.S3_REGION,
          storagePathPrefix: opts.shopName.toLowerCase().replace(/\s+/g, '-')
        }
      },
      kyc: {
        create: {
          status: opts.kycStatus
        }
      },
      subscription: opts.status === 'ACTIVE'
        ? {
            create: {
              plan: { connect: { id: opts.planId } },
              status: 'ACTIVE',
              startDate: new Date()
            }
          }
        : undefined,
      inventory: {
        create: [
          {
            sku: 'SKU-001',
            name: 'Parle-G Biscuits',
            price: 10,
            mrp: 12,
            stockQuantity: 50,
            taxPercentage: 5
          },
          {
            sku: 'SKU-002',
            name: 'Aashirvaad Atta 5kg',
            price: 240,
            mrp: 260,
            stockQuantity: 20,
            taxPercentage: 5
          }
        ]
      },
      customers: {
        create: [
          {
            name: 'Suman',
            phone: '+91 98450 12345',
            email: 'suman@example.com'
          },
          {
            name: 'Anita',
            phone: '+91 99000 77788'
          }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      retailerId: retailer.id,
      paymentMode: 'UPI',
      subtotalAmount: 300,
      taxAmount: 15,
      totalAmount: 315,
      items: {
        create: [
          {
            sku: 'SKU-001',
            name: 'Parle-G Biscuits',
            quantity: 10,
            price: 10,
            taxPercentage: 5
          },
          {
            sku: 'SKU-002',
            name: 'Aashirvaad Atta 5kg',
            quantity: 1,
            price: 240,
            taxPercentage: 5
          }
        ]
      }
    }
  });

  return retailer;
}

async function main() {
  const superAdmin = await ensureSuperAdmin();
  const starterPlan = await getOrCreatePlan('Starter', 499, 'MONTHLY', [
    'Unlimited billing',
    'Inventory sync',
    'Basic analytics'
  ]);
  await getOrCreatePlan('Growth', 1499, 'MONTHLY', [
    'Advanced analytics',
    'Multi-device support',
    'Priority support'
  ]);

  await seedRetailer({
    name: 'Lakshmi',
    shopName: 'Lakshmi Kirana Stores',
    contactEmail: 'lakshmi@demo.shop',
    contactPhone: '+91 99887 66554',
    address: '12th Cross, Indiranagar, Bangalore',
    gstEnabled: true,
    gstNumber: '29ABCDE1234F1Z5',
    languagePreference: 'en',
    planId: starterPlan.id,
    status: 'ACTIVE',
    adminPassword: 'retailer123',
    kycStatus: 'APPROVED'
  });

  await seedRetailer({
    name: 'Arun',
    shopName: 'Fresh Mart Express',
    contactEmail: 'arun@freshmart.shop',
    contactPhone: '+91 98765 44321',
    address: 'HSR Layout, Bangalore',
    gstEnabled: false,
    languagePreference: 'hi',
    planId: starterPlan.id,
    status: 'PENDING_ONBOARDING',
    adminPassword: 'retailer123',
    kycStatus: 'PENDING'
  });

  console.log('Seed complete.');
  if (superAdmin.password) {
    console.log(`Super admin credentials -> ${superAdmin.email} / ${superAdmin.password}`);
  }
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

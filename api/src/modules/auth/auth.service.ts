import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import type { LoginInput, OtpLoginInput } from './auth.schema.js';

const OTP_CODE = '123456';

const assertRetailerCanAccess = (retailer: { status: string } | null) => {
  if (!retailer) {
    return;
  }

  if (retailer.status === 'ACTIVE') {
    return;
  }

  const error = new Error(
    retailer.status === 'PENDING_ONBOARDING'
      ? 'Your onboarding application is under review. Sign in will be enabled after approval.'
      : 'Your retailer account is suspended. Please contact support.'
  );
  error.name = 'ForbiddenError';
  throw error;
};

export const login = async ({ email, password, role }: LoginInput) => {
  const retailerUser = await prisma.user.findUnique({
    where: { email },
    include: {
      retailer: {
        select: {
          status: true,
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
        }
      }
    }
  });

  if (!retailerUser) {
    const error = new Error('Invalid credentials');
    error.name = 'AuthError';
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, retailerUser.passwordHash);
  if (!passwordMatches) {
    const error = new Error('Invalid credentials');
    error.name = 'AuthError';
    throw error;
  }

  if (role && retailerUser.role !== role) {
    const error = new Error('Invalid role for this account');
    error.name = 'AuthError';
    throw error;
  }

  assertRetailerCanAccess(retailerUser.retailer);

  const token = jwt.sign(
    {
      id: retailerUser.id,
      role: retailerUser.role,
      retailerId: retailerUser.retailerId,
      storeType: retailerUser.retailer?.storeType,
      settings: retailerUser.retailer?.settings ?? null
    },
    env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return {
    token,
    user: {
      id: retailerUser.id,
      name: retailerUser.name,
      email: retailerUser.email,
      role: retailerUser.role,
      retailerId: retailerUser.retailerId,
      storeType: retailerUser.retailer?.storeType,
      settings: retailerUser.retailer?.settings ?? null
    }
  };
};

export const loginWithOtp = async ({ phone, otp, role }: OtpLoginInput) => {
  if (otp !== OTP_CODE) {
    const error = new Error('Invalid OTP');
    error.name = 'AuthError';
    throw error;
  }

  const retailer = await prisma.retailer.findFirst({
    where: { contactPhone: phone },
    select: {
      id: true,
      status: true,
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
    }
  });

  if (!retailer) {
    const error = new Error('Invalid credentials');
    error.name = 'AuthError';
    throw error;
  }

  assertRetailerCanAccess(retailer);

  const userRole = role ?? 'RETAILER_ADMIN';
  const retailerUser = await prisma.user.findFirst({
    where: { retailerId: retailer.id, role: userRole }
  });

  if (!retailerUser) {
    const error = new Error('Invalid credentials');
    error.name = 'AuthError';
    throw error;
  }

  const token = jwt.sign(
    {
      id: retailerUser.id,
      role: retailerUser.role,
      retailerId: retailerUser.retailerId,
      storeType: retailer.storeType,
      settings: retailer.settings ?? null
    },
    env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return {
    token,
    user: {
      id: retailerUser.id,
      name: retailerUser.name,
      email: retailerUser.email,
      role: retailerUser.role,
      retailerId: retailerUser.retailerId,
      storeType: retailer.storeType,
      settings: retailer.settings ?? null
    }
  };
};

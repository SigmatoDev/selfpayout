import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import type { LoginInput, OtpLoginInput } from './auth.schema.js';

const OTP_CODE = '123456';

export const login = async ({ email, password, role }: LoginInput) => {
  const retailerUser = await prisma.user.findUnique({
    where: { email }
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

  const token = jwt.sign(
    {
      id: retailerUser.id,
      role: retailerUser.role,
      retailerId: retailerUser.retailerId
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
      retailerId: retailerUser.retailerId
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
    select: { id: true }
  });

  if (!retailer) {
    const error = new Error('Invalid credentials');
    error.name = 'AuthError';
    throw error;
  }

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
      retailerId: retailerUser.retailerId
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
      retailerId: retailerUser.retailerId
    }
  };
};

import jwt from 'jsonwebtoken';

import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import type { ConsumerOtpRequestInput, ConsumerOtpVerifyInput, ConsumerProfileUpdateInput } from './consumer.schema.js';

const OTP_CODE = '123456';

export const requestOtp = async (_input: ConsumerOtpRequestInput) => {
  return { message: 'OTP sent', otp: OTP_CODE };
};

export const verifyOtp = async (input: ConsumerOtpVerifyInput) => {
  if (input.otp !== OTP_CODE) {
    const error = new Error('Invalid OTP');
    error.name = 'AuthError';
    throw error;
  }

  const consumer = await prisma.consumer.upsert({
    where: { phone: input.phone },
    create: { phone: input.phone },
    update: {}
  });

  const token = jwt.sign(
    {
      id: consumer.id,
      role: 'CONSUMER'
    },
    env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return {
    token,
    consumer
  };
};

export const getConsumer = async (id: string) =>
  prisma.consumer.findUnique({
    where: { id }
  });

export const updateConsumer = async (id: string, input: ConsumerProfileUpdateInput) =>
  prisma.consumer.update({
    where: { id },
    data: input
  });

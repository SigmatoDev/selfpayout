import crypto from 'crypto';
import { randomUUID } from 'crypto';

import Razorpay from 'razorpay';

import type { PaymentStatus } from '@prisma/client';

import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import type { PaymentLinkInput, PaymentRefundInput, PaymentWebhookInput } from './payment.schema';

const razorpay = env.RAZORPAY_KEY_ID
  ? new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET ?? ''
    })
  : null;

export const createPaymentLink = async ({ retailerId, planId, amount, currency, email, phone }: PaymentLinkInput) => {
  if (!razorpay) {
    throw Object.assign(new Error('Razorpay not configured'), { status: 400 });
  }

  const retailer = await prisma.retailer.findUnique({ where: { id: retailerId } });
  if (!retailer) {
    const error = new Error('Retailer not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    const error = new Error('Subscription plan not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const referenceId = randomUUID();

  const link = await razorpay.paymentLink.create({
    amount: Math.round(amount * 100),
    currency,
    reference_id: referenceId,
    description: `Subscription ${plan.name}`,
    customer: {
      name: retailer.name,
      email,
      contact: phone
    },
    notes: {
      retailerId,
      planId,
      referenceId
    },
    reminder_enable: true
  } as any);

  const payment = await (prisma.payment as any).create({
    data: {
      retailerId,
      planId,
      razorpayPaymentLinkId: link.id,
      amount,
      currency,
      status: 'PENDING',
      referenceId
    }
  });

  return {
    link,
    paymentId: payment.id,
    referenceId
  };
};

const normalizeStatus = (status?: string): PaymentStatus => {
  if (!status) return 'UNKNOWN';
  const normalized = status.toUpperCase() as PaymentStatus;
  if (['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'UNKNOWN'].includes(normalized)) {
    return normalized;
  }
  return 'UNKNOWN';
};

export const handlePaymentWebhook = async (
  payload: PaymentWebhookInput,
  signature?: string,
  rawBody?: string
) => {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw Object.assign(new Error('Razorpay webhook secret not configured'), { status: 500 });
  }

  if (!signature || !rawBody) {
    throw Object.assign(new Error('Missing webhook signature'), { status: 400 });
  }

  const digest = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (digest !== signature) {
    throw Object.assign(new Error('Invalid webhook signature'), { status: 401 });
  }

  const paymentEntity = payload.payload?.payment?.entity as
    | {
        notes?: Record<string, string>;
        status?: string;
        id?: string;
        amount?: number;
      }
    | undefined;

  if (!paymentEntity) {
    return;
  }

  const referenceId = paymentEntity.notes?.referenceId ?? paymentEntity.notes?.paymentRecordId;
  const status = normalizeStatus(paymentEntity.status);

  const updateData = {
    status,
    razorpayPaymentId: paymentEntity.id ?? null
  };

  if (referenceId) {
    await (prisma.payment as any).updateMany({
      where: { referenceId },
      data: updateData
    });
  } else if (paymentEntity.id) {
    await (prisma.payment as any).updateMany({
      where: { razorpayPaymentId: paymentEntity.id },
      data: updateData
    });
  }
};

export const refundPayment = async ({ paymentId, amount, reason }: PaymentRefundInput) => {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    const error = new Error('Payment not found');
    error.name = 'NotFoundError';
    throw error;
  }

  if (!razorpay) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' }
    });
  }

  if (!payment.razorpayPaymentId) {
    throw Object.assign(new Error('Payment not captured yet'), { status: 400 });
  }

  await (razorpay as any).payments.refund(payment.razorpayPaymentId, {
    amount: amount ? Math.round(amount * 100) : undefined,
    notes: reason ? { reason } : undefined
  });

  return prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'REFUNDED' }
  });
};

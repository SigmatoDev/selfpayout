import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { paymentLinkSchema, paymentRefundSchema, paymentWebhookSchema } from './payment.schema.js';
import { createPaymentLink, handlePaymentWebhook, refundPayment } from './payment.service.js';

export const createPaymentLinkHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = paymentLinkSchema.parse(req.body);
  const link = await createPaymentLink(payload);
  res.status(201).json({ data: link });
});

export const paymentWebhookHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = paymentWebhookSchema.parse({ event: req.body.event, payload: req.body.payload });
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  const rawBody = (req as AuthenticatedRequest & { rawBody?: Buffer }).rawBody?.toString();
  await handlePaymentWebhook(payload, signature, rawBody);
  res.json({ received: true });
});

export const refundPaymentHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = paymentRefundSchema.parse(req.body);
  const payment = await refundPayment(payload);
  res.json({ data: payment });
});

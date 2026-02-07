import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  consumerOtpRequestSchema,
  consumerOtpVerifySchema,
  consumerProfileUpdateSchema
} from './consumer.schema.js';
import { getConsumer, requestOtp, updateConsumer, verifyOtp } from './consumer.service.js';

export const requestOtpHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = consumerOtpRequestSchema.parse(req.body);
  const result = await requestOtp(payload);
  res.json(result);
});

export const verifyOtpHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = consumerOtpVerifySchema.parse(req.body);
  const result = await verifyOtp(payload);
  res.json(result);
});

export const currentConsumerHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'CONSUMER') {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const consumer = await getConsumer(req.user.id);
  if (!consumer) {
    return res.status(404).json({ message: 'Consumer not found' });
  }
  res.json({ data: consumer });
});

export const updateConsumerHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'CONSUMER') {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const payload = consumerProfileUpdateSchema.parse(req.body);
  const consumer = await updateConsumer(req.user.id, payload);
  res.json({ data: consumer });
});

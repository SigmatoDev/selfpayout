import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import type { AuthenticatedRequest } from '../../middleware/auth';
import {
  sessionItemIdSchema,
  sessionItemSchema,
  sessionListSchema,
  sessionPaymentSchema,
  sessionStartSchema,
  sessionSubmitSchema,
  sessionVerifySchema
} from './session.schema';
import {
  addItemToSession,
  getSession,
  listSelfCheckoutSessions,
  markSessionPaid,
  removeItemFromSession,
  startSelfCheckoutSession,
  submitSession,
  verifySession
} from './session.service';

export const startSessionHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = sessionStartSchema.parse(req.body);
  const session = await startSelfCheckoutSession(payload);
  res.status(201).json({ data: session });
});

export const getSessionHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const session = await getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }
  res.json({ data: session });
});

export const addItemHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = sessionItemSchema.parse(req.body);
  const session = await addItemToSession(req.params.id, payload);
  res.json({ data: session });
});

export const removeItemHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = sessionItemIdSchema.parse({ itemId: req.params.itemId });
  const session = await removeItemFromSession(req.params.id, params.itemId);
  res.json({ data: session });
});

export const submitSessionHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = sessionSubmitSchema.parse(req.body ?? {});
  const session = await submitSession(req.params.id, payload);
  res.json({ data: session });
});

export const verifySessionHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = sessionVerifySchema.parse(req.body ?? {});
  const session = await verifySession(req.params.id, payload);
  res.json({ data: session });
});

export const listSessionsHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters = sessionListSchema.parse({
    status: req.query.status,
    retailerId: req.query.retailerId,
    storeType: req.query.storeType
  });

  const retailerConstraint =
    req.user?.role === 'SUPER_ADMIN' ? filters.retailerId : req.user?.retailerId;

  const sessions = await listSelfCheckoutSessions(filters, retailerConstraint);
  res.json({ data: sessions });
});

export const markPaymentHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = sessionPaymentSchema.parse(req.body ?? {});
  const retailerId = req.user?.role === 'SUPER_ADMIN' ? payload.retailerId : req.user?.retailerId;

  if (!retailerId && req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Retailer context required for payment confirmation' });
  }

  const result = await markSessionPaid(req.params.id, { ...payload, retailerId: retailerId ?? undefined });
  res.json({ data: result });
});

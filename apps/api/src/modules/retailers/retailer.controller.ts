import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import type { AuthenticatedRequest } from '../../middleware/auth';
import { retailerCreateSchema, retailerQuerySchema, retailerSignupSchema, retailerUpdateSchema } from './retailer.schema';
import {
  createRetailer,
  disableRetailer,
  enableRetailer,
  listRetailers,
  submitRetailerOnboarding,
  updateRetailer
} from './retailer.service';

export const listRetailersHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const query = retailerQuerySchema.safeParse(req.query);
  const retailers = await listRetailers(query.success ? query.data : {});
  res.json({ data: retailers });
});

export const createRetailerHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = retailerCreateSchema.parse(req.body);
  const result = await createRetailer(payload);
  res.status(201).json({ data: result });
});

export const retailerSignupHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = retailerSignupSchema.parse(req.body);
  const application = await submitRetailerOnboarding(payload);
  res.status(202).json({
    data: {
      applicationId: application.id,
      status: application.status,
      receivedAt: application.createdAt
    },
    message: 'Thanks! Your onboarding request is under review.'
  });
});

export const updateRetailerHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = retailerUpdateSchema.parse(req.body);
  const result = await updateRetailer(req.params.id, payload);
  res.json({ data: result });
});

export const disableRetailerHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const retailer = await disableRetailer(req.params.id);
  res.json({ data: retailer });
});

export const enableRetailerHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const retailer = await enableRetailer(req.params.id);
  res.json({ data: retailer });
});

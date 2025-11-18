import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { kycUpdateSchema } from './kyc.schema.js';
import { listPendingKyc, updateKycStatus } from './kyc.service.js';

export const listPendingKycHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter = (req.query.status as string | undefined)?.toUpperCase();
  const allowed = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const;
  const status = allowed.includes(filter as (typeof allowed)[number]) ? (filter as (typeof allowed)[number]) : 'PENDING';
  const retailerId = req.query.retailerId as string | undefined;
  const kycs = await listPendingKyc(status, retailerId);
  res.json({ data: kycs });
});

export const updateKycStatusHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = kycUpdateSchema.parse(req.body);
  const updated = await updateKycStatus(payload);
  res.json({ data: updated });
});

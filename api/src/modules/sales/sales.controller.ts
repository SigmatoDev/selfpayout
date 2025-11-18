import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { salesSummaryQuerySchema } from './sales.schema.js';
import { getDailySalesSummary, getOutstandingLedger } from './sales.service.js';

export const salesSummaryHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const query = salesSummaryQuerySchema.parse({
    retailerId: req.query.retailerId ?? req.user?.retailerId,
    from: req.query.from,
    to: req.query.to
  });

  const summary = await getDailySalesSummary(
    query.retailerId,
    query.from ? new Date(query.from) : undefined,
    query.to ? new Date(query.to) : undefined
  );
  res.json({ data: summary });
});

export const outstandingLedgerHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const retailerId = (req.query.retailerId as string) ?? req.user?.retailerId;
  if (!retailerId) {
    return res.status(400).json({ message: 'retailerId required' });
  }
  const ledger = await getOutstandingLedger(retailerId);
  res.json({ data: ledger });
});

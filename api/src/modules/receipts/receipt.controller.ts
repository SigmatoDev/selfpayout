import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { createInvoiceSchema } from './receipt.schema.js';
import { createInvoice, listInvoices } from './receipt.service.js';

export const createInvoiceHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = createInvoiceSchema.parse({ ...req.body, retailerId: req.body.retailerId ?? req.user?.retailerId });
  const invoice = await createInvoice(payload);
  res.status(201).json({ data: invoice });
});

export const listInvoicesHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const retailerId = req.user?.retailerId ?? (req.query.retailerId as string);
  if (!retailerId) {
    return res.status(400).json({ message: 'retailerId required' });
  }
  const invoices = await listInvoices(retailerId);
  res.json({ data: invoices });
});

import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import type { AuthenticatedRequest } from '../../middleware/auth';
import { customerSchema } from './customer.schema';
import { fetchCustomerHistory, listCustomers, upsertCustomer } from './customer.service';

export const listCustomersHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const retailerId = req.user?.retailerId ?? (req.query.retailerId as string);
  if (!retailerId) {
    return res.status(400).json({ message: 'retailerId required' });
  }
  const customers = await listCustomers(retailerId);
  res.json({ data: customers });
});

export const upsertCustomerHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = customerSchema.parse({ ...req.body, retailerId: req.body.retailerId ?? req.user?.retailerId });
  const customer = await upsertCustomer(payload);
  res.json({ data: customer });
});

export const customerHistoryHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const retailerId = req.user?.retailerId ?? (req.query.retailerId as string);
  if (!retailerId) {
    return res.status(400).json({ message: 'retailerId required' });
  }

  const history = await fetchCustomerHistory(retailerId, req.params.id);
  res.json({ data: history });
});

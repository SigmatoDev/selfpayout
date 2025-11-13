import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import { outstandingLedgerHandler, salesSummaryHandler } from './sales.controller';

export const salesRouter = Router();

salesRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
salesRouter.get('/summary', salesSummaryHandler);
salesRouter.get('/ledger', outstandingLedgerHandler);

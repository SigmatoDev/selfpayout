import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import {
  addItemHandler,
  getSessionHandler,
  listSessionsHandler,
  markPaymentHandler,
  removeItemHandler,
  startSessionHandler,
  submitSessionHandler,
  verifySessionHandler
} from './session.controller';

export const selfCheckoutRouter = Router();

selfCheckoutRouter.post('/sessions', startSessionHandler);
selfCheckoutRouter.get('/sessions/:id', getSessionHandler);
selfCheckoutRouter.post('/sessions/:id/items', addItemHandler);
selfCheckoutRouter.delete('/sessions/:id/items/:itemId', removeItemHandler);
selfCheckoutRouter.post('/sessions/:id/submit', submitSessionHandler);

selfCheckoutRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
selfCheckoutRouter.get('/sessions', listSessionsHandler);
selfCheckoutRouter.post('/sessions/:id/mark-payment', markPaymentHandler);
selfCheckoutRouter.post('/sessions/:id/verify', verifySessionHandler);

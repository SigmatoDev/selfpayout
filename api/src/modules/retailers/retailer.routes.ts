import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import {
  createRetailerHandler,
  disableRetailerHandler,
  enableRetailerHandler,
  listRetailersHandler,
  retailerSignupHandler,
  updateRetailerHandler
} from './retailer.controller.js';

export const retailerRouter: ExpressRouter = Router();

retailerRouter.post('/signup', retailerSignupHandler);
retailerRouter.use(authenticate(['SUPER_ADMIN']));
retailerRouter.get('/', listRetailersHandler);
retailerRouter.post('/', createRetailerHandler);
retailerRouter.patch('/:id', updateRetailerHandler);
retailerRouter.post('/:id/disable', disableRetailerHandler);
retailerRouter.post('/:id/enable', enableRetailerHandler);

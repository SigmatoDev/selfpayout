import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import {
  createKitchenTicketHandler,
  deleteTableHandler,
  getMenuHandler,
  listTablesHandler,
  listPublicTablesHandler,
  upsertMenuHandler,
  upsertTableHandler
} from './restaurant.controller.js';

export const restaurantRouter: ExpressRouter = Router();

// Public menu retrieval for customers
restaurantRouter.get('/:id/menu', getMenuHandler);
// Public tables (available only) for customers using retailer code/email/id
restaurantRouter.get('/:id/public-tables', listPublicTablesHandler);

// Staff/admin routes
restaurantRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
restaurantRouter.post('/:id/menu', upsertMenuHandler);
restaurantRouter.get('/:id/tables', listTablesHandler);
restaurantRouter.post('/:id/tables', upsertTableHandler);
restaurantRouter.delete('/:id/tables/:tableId', deleteTableHandler);
restaurantRouter.post('/:id/kot', createKitchenTicketHandler);

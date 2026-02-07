import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import {
  bulkUploadHandler,
  listInventoryHandler,
  listPublicCategoriesHandler,
  listPublicInventoryHandler,
  upsertItemHandler
} from './inventory.controller.js';

export const inventoryRouter: ExpressRouter = Router();

inventoryRouter.get('/public', listPublicInventoryHandler);
inventoryRouter.get('/public/categories', listPublicCategoriesHandler);
inventoryRouter.use(authenticate(['SUPER_ADMIN', 'RETAILER_ADMIN', 'RETAILER_STAFF']));
inventoryRouter.get('/', listInventoryHandler);
inventoryRouter.post('/', upsertItemHandler);
inventoryRouter.post('/bulk', bulkUploadHandler);

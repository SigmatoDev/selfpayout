import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth';
import { bulkUploadHandler, listInventoryHandler, upsertItemHandler } from './inventory.controller';

export const inventoryRouter: ExpressRouter = Router();

inventoryRouter.use(authenticate(['SUPER_ADMIN', 'RETAILER_ADMIN', 'RETAILER_STAFF']));
inventoryRouter.get('/', listInventoryHandler);
inventoryRouter.post('/', upsertItemHandler);
inventoryRouter.post('/bulk', bulkUploadHandler);

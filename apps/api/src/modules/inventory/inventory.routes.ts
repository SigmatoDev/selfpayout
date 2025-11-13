import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import { bulkUploadHandler, listInventoryHandler, upsertItemHandler } from './inventory.controller';

export const inventoryRouter = Router();

inventoryRouter.use(authenticate(['SUPER_ADMIN', 'RETAILER_ADMIN', 'RETAILER_STAFF']));
inventoryRouter.get('/', listInventoryHandler);
inventoryRouter.post('/', upsertItemHandler);
inventoryRouter.post('/bulk', bulkUploadHandler);

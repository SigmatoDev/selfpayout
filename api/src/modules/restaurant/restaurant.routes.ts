import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import {
  createKitchenTicketHandler,
  createTableGroupHandler,
  deleteTableHandler,
  deleteTableGroupHandler,
  deleteTokenHandler,
  getMenuHandler,
  getRestaurantSettingsHandler,
  listTablesHandler,
  listTableGroupsHandler,
  listPublicTablesHandler,
  listTokensHandler,
  updateRestaurantSettingsHandler,
  uploadMenuImageHandler,
  upsertMenuHandler,
  upsertTokenHandler,
  upsertTableHandler
} from './restaurant.controller.js';
import {
  applyRestaurantRecipeDraftHandler as applyRestaurantRecipeDraftAIHandler,
  applyRestaurantSetupDraftHandler as applyRestaurantSetupDraftAIHandler,
  generateRestaurantMenuItemImageHandler as generateRestaurantMenuItemImageAIHandler,
  generateRestaurantRecipeDraftHandler as generateRestaurantRecipeDraftAIHandler,
  generateRestaurantSetupDraftHandler as generateRestaurantSetupDraftAIHandler
} from './restaurant-ai.controller.js';
import {
  adjustRawMaterialStockHandler,
  getDailyStockSummaryHandler,
  listMenuItemRecipesHandler,
  listRawMaterialsHandler,
  replaceMenuItemRecipeHandler,
  upsertRawMaterialHandler
} from './restaurant-stock.controller.js';

export const restaurantRouter: ExpressRouter = Router();

// Public menu retrieval for customers
restaurantRouter.get('/:id/menu', getMenuHandler);
// Public tables (available only) for customers using retailer code/email/id
restaurantRouter.get('/:id/public-tables', listPublicTablesHandler);

// Staff/admin routes
restaurantRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
restaurantRouter.post('/:id/menu', upsertMenuHandler);
restaurantRouter.post('/:id/menu-image', uploadMenuImageHandler);
restaurantRouter.post('/:id/ai/setup-draft', generateRestaurantSetupDraftAIHandler);
restaurantRouter.post('/:id/ai/apply-draft', applyRestaurantSetupDraftAIHandler);
restaurantRouter.post('/:id/ai/recipe-draft', generateRestaurantRecipeDraftAIHandler);
restaurantRouter.post('/:id/ai/apply-recipe-draft', applyRestaurantRecipeDraftAIHandler);
restaurantRouter.post('/:id/ai/menu-image', generateRestaurantMenuItemImageAIHandler);
restaurantRouter.get('/:id/raw-materials', listRawMaterialsHandler);
restaurantRouter.post('/:id/raw-materials', upsertRawMaterialHandler);
restaurantRouter.patch('/:id/raw-materials/:materialId/adjust', adjustRawMaterialStockHandler);
restaurantRouter.get('/:id/recipes', listMenuItemRecipesHandler);
restaurantRouter.post('/:id/menu-items/:menuItemId/recipe', replaceMenuItemRecipeHandler);
restaurantRouter.get('/:id/stock-summary', getDailyStockSummaryHandler);
restaurantRouter.get('/:id/tables', listTablesHandler);
restaurantRouter.post('/:id/tables', upsertTableHandler);
restaurantRouter.delete('/:id/tables/:tableId', deleteTableHandler);
restaurantRouter.get('/:id/tokens', listTokensHandler);
restaurantRouter.post('/:id/tokens', upsertTokenHandler);
restaurantRouter.delete('/:id/tokens/:tokenId', deleteTokenHandler);
restaurantRouter.get('/:id/table-groups', listTableGroupsHandler);
restaurantRouter.post('/:id/table-groups', createTableGroupHandler);
restaurantRouter.delete('/:id/table-groups/:groupId', deleteTableGroupHandler);
restaurantRouter.get('/:id/settings', getRestaurantSettingsHandler);
restaurantRouter.patch('/:id/settings', updateRestaurantSettingsHandler);
restaurantRouter.post('/:id/kot', createKitchenTicketHandler);

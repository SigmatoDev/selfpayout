import { Router, type Router as ExpressRouter } from 'express';

import { adminRouter } from './modules/admin/admin.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { consumerRouter } from './modules/consumers/consumer.routes.js';
import { customerRouter } from './modules/customers/customer.routes.js';
import { inventoryRouter } from './modules/inventory/inventory.routes.js';
import { kycRouter } from './modules/kyc/kyc.routes.js';
import { paymentRouter } from './modules/payments/payment.routes.js';
import { retailerRouter } from './modules/retailers/retailer.routes.js';
import { receiptRouter } from './modules/receipts/receipt.routes.js';
import { salesRouter } from './modules/sales/sales.routes.js';
import { selfCheckoutRouter } from './modules/self-checkout/session.routes.js';
import { subscriptionRouter } from './modules/subscriptions/subscription.routes.js';
import { restaurantRouter } from './modules/restaurant/restaurant.routes.js';
import { ticketingRouter } from './modules/ticketing/ticketing.routes.js';
import { marketplaceRouter } from './modules/marketplace/marketplace.routes.js';
import { counterRouter } from './modules/counter/counter.routes.js';

export const router: ExpressRouter = Router();

router.use('/auth', authRouter);
router.use('/consumers', consumerRouter);
router.use('/admin', adminRouter);
router.use('/retailers', retailerRouter);
router.use('/subscriptions', subscriptionRouter);
router.use('/kyc', kycRouter);
router.use('/payments', paymentRouter);
router.use('/inventory', inventoryRouter);
router.use('/customers', customerRouter);
router.use('/receipts', receiptRouter);
router.use('/sales', salesRouter);
router.use('/self-checkout', selfCheckoutRouter);
router.use('/restaurants', restaurantRouter);
router.use('/ticketing', ticketingRouter);
router.use('/marketplace', marketplaceRouter);
router.use('/counter', counterRouter);

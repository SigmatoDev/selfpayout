import { Router, type Router as ExpressRouter } from 'express';

import { adminRouter } from './modules/admin/admin.routes';
import { authRouter } from './modules/auth/auth.routes';
import { customerRouter } from './modules/customers/customer.routes';
import { inventoryRouter } from './modules/inventory/inventory.routes';
import { kycRouter } from './modules/kyc/kyc.routes';
import { paymentRouter } from './modules/payments/payment.routes';
import { retailerRouter } from './modules/retailers/retailer.routes';
import { receiptRouter } from './modules/receipts/receipt.routes';
import { salesRouter } from './modules/sales/sales.routes';
import { selfCheckoutRouter } from './modules/self-checkout/session.routes';
import { subscriptionRouter } from './modules/subscriptions/subscription.routes';

export const router: ExpressRouter = Router();

router.use('/auth', authRouter);
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

import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth';
import { createPaymentLinkHandler, paymentWebhookHandler, refundPaymentHandler } from './payment.controller';

export const paymentRouter: ExpressRouter = Router();

paymentRouter.post('/links', authenticate(['SUPER_ADMIN']), createPaymentLinkHandler);
paymentRouter.post('/refunds', authenticate(['SUPER_ADMIN']), refundPaymentHandler);
paymentRouter.post('/webhook', paymentWebhookHandler);

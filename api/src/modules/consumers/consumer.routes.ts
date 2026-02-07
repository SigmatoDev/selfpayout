import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import {
  currentConsumerHandler,
  requestOtpHandler,
  updateConsumerHandler,
  verifyOtpHandler
} from './consumer.controller.js';

export const consumerRouter: ExpressRouter = Router();

consumerRouter.post('/auth/request-otp', requestOtpHandler);
consumerRouter.post('/auth/verify-otp', verifyOtpHandler);
consumerRouter.get('/me', authenticate(['CONSUMER']), currentConsumerHandler);
consumerRouter.patch('/me', authenticate(['CONSUMER']), updateConsumerHandler);

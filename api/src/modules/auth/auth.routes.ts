import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { currentUserHandler, loginHandler, loginWithOtpHandler } from './auth.controller.js';

export const authRouter: ExpressRouter = Router();

authRouter.post('/login', loginHandler);
authRouter.post('/login-otp', loginWithOtpHandler);
authRouter.get('/me', authenticate(), currentUserHandler);

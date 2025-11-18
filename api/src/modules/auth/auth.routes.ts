import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { currentUserHandler, loginHandler } from './auth.controller.js';

export const authRouter: ExpressRouter = Router();

authRouter.post('/login', loginHandler);
authRouter.get('/me', authenticate(), currentUserHandler);

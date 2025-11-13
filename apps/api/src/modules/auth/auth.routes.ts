import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import { currentUserHandler, loginHandler } from './auth.controller';

export const authRouter = Router();

authRouter.post('/login', loginHandler);
authRouter.get('/me', authenticate(), currentUserHandler);

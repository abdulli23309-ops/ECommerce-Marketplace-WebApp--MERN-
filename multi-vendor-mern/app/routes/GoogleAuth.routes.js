import { Router } from 'express';
import * as googleAuthController from '../controllers/GoogleAuth.controller.js';
import { authLimiter } from '../middleware/RateLimit.middleware.js';

const router = Router();

router.post('/', authLimiter(), googleAuthController.googleLogin);

export default router;
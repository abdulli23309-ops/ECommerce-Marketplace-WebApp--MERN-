import { Router } from 'express';
import * as emailOtpController from '../controllers/EmailOtp.controller.js';
import { authenticate } from '../middleware/Auth.middleware.js';
import { otpLimiter } from '../middleware/RateLimit.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/send', otpLimiter(), emailOtpController.sendOtp);
router.post('/verify', otpLimiter(), emailOtpController.verifyOtp);

export default router;
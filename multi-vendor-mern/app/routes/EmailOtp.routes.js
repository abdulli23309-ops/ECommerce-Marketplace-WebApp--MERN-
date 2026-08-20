import { Router } from 'express';
import * as emailOtpController from '../controllers/EmailOtp.controller.js';
import { authenticate } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/send', emailOtpController.sendOtp);
router.post('/verify', emailOtpController.verifyOtp);

export default router;
import { Router } from 'express';
import * as paymentController from '../controllers/Payment.controller.js';
import { authenticate } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate);
router.post('/', paymentController.createPayment);
router.get('/:parentOrderId', paymentController.getPaymentStatus);

export default router;
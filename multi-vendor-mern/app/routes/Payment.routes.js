import { Router } from 'express';
import Payment from '../models/Payment.model.js';
import * as paymentController from '../controllers/Payment.controller.js';
import * as paymentService from '../services/Payment.service.js';
import { authenticate } from '../middleware/Auth.middleware.js';

const router = Router();


router.use(authenticate);

// TEMPORARY – for testing webhook finalisation (remove after Phase 6)


// NEW – Stripe / COD payment intent creation
router.post('/create-intent', paymentController.createPaymentIntent);

// OLD dummy payment – keep for backward compatibility
router.post('/', paymentController.createPayment);

// Get payment status
router.get('/:parentOrderId', paymentController.getPaymentStatus);

export default router;
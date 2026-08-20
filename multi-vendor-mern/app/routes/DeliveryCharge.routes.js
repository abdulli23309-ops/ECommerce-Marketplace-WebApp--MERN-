import { Router } from 'express';
import * as deliveryChargeController from '../controllers/DeliveryCharge.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate, requireRole('Admin'));

router.get('/', deliveryChargeController.getAll);
router.put('/:sellerProfileId', deliveryChargeController.upsert);

export default router;
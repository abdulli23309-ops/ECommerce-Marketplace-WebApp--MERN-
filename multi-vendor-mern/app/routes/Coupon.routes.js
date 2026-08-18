import { Router } from 'express';
import * as couponController from '../controllers/Coupon.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

router.post('/validate', authenticate, couponController.validateCoupon);

router.use(authenticate, requireRole('Admin'));
router.post('/', couponController.createCoupon);
router.get('/', couponController.listCoupons);
router.patch('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);

export default router;
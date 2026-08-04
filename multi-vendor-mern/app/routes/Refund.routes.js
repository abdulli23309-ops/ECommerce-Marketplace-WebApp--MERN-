import { Router } from 'express';
import * as refundController from '../controllers/Refund.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate, requireRole('Admin'));

router.post('/', refundController.createRefund);
router.get('/:returnRequestId', refundController.getRefundByReturn);

export default router;
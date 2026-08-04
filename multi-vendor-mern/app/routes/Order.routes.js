import { Router } from 'express';
import * as orderController from '../controllers/Order.controller.js';
import * as orderHistoryController from '../controllers/Order.history.controller.js';
import { authenticate } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/checkout', orderController.checkout);
router.get('/', orderHistoryController.getMyOrders);
router.get('/:id', orderHistoryController.getOrderById);

export default router;
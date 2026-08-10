import { Router } from 'express';
import * as orderController from '../controllers/Order.controller.js';
import * as orderHistoryController from '../controllers/Order.history.controller.js';
import { authenticate } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate);

// Customer checkout
router.post('/checkout', orderController.checkout);

// Get single seller order (for review page, returns product info)
router.get('/seller-orders/:id', orderController.getSellerOrderById);

// Customer order history
router.get('/', orderHistoryController.getMyOrders);
router.put('/:id/cancel', orderController.cancelOrder);

// Single order detail
router.get('/:id', orderHistoryController.getOrderById);

export default router;
import { Router } from 'express';
import * as sellerDashboardController from '../controllers/Seller.dashboard.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();
router.use(authenticate, requireRole('Seller'));

router.get('/dashboard', sellerDashboardController.getDashboard);
router.get('/orders', sellerDashboardController.getOrders);
router.get('/reviews', sellerDashboardController.getReviews);

export default router;

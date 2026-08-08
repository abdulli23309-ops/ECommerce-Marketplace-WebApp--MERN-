import { Router } from 'express';
import * as sellerDashboardController from '../controllers/Seller.dashboard.controller.js';
import * as sellerController from '../controllers/Seller.controller.js';   // we'll create this if missing
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';
import { uploadProductImages } from '../helpers/FileUpload.helper.js'; 

const router = Router();

// These routes are for any authenticated user (e.g., a customer becoming a seller)
router.get('/status', authenticate, sellerController.getStatus);
router.post('/profile', authenticate, sellerController.createProfile);
router.post('/store/logo', authenticate, requireRole('Seller'), uploadProductImages, sellerController.uploadStoreLogo);
// All other seller routes require the Seller role
router.use(authenticate, requireRole('Seller'));

router.get('/seller-orders/:id', authenticate, requireRole('Seller'), sellerController.getSellerOrderById);
router.get('/dashboard', sellerDashboardController.getDashboard);
router.get('/orders', sellerDashboardController.getOrders);
router.get('/reviews', sellerDashboardController.getReviews);

export default router;
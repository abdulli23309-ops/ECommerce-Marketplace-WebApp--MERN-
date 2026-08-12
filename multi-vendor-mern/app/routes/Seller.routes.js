import { Router } from 'express';
import * as sellerDashboardController from '../controllers/Seller.dashboard.controller.js';
import * as sellerController from '../controllers/Seller.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';
import { uploadProductImages } from '../helpers/FileUpload.helper.js';

const router = Router();

// ---------- Public / Customer‑accessible routes ----------
router.get('/status', authenticate, sellerController.getStatus);
router.post('/profile', authenticate, sellerController.createProfile);
router.post('/apply', authenticate, uploadProductImages, sellerController.applyAsSeller);   // ← moved here

// ---------- Seller‑only routes ----------
router.use(authenticate, requireRole('Seller'));

router.post('/store/logo', uploadProductImages, sellerController.uploadStoreLogo);
router.get('/seller-orders/:id', sellerController.getSellerOrderById);
router.get('/orders/unread-count', sellerDashboardController.getUnreadOrderCount);
router.post('/orders/mark-read', sellerDashboardController.markOrdersAsRead);
router.put('/reviews/:reviewId/reply', sellerDashboardController.replyToReview);
router.get('/dashboard', sellerDashboardController.getDashboard);
router.get('/orders', sellerDashboardController.getOrders);
router.get('/reviews', sellerDashboardController.getReviews);
router.get('/profile', sellerController.getProfile);       // GET own seller profile
router.put('/profile', sellerController.updateProfile); 

export default router;
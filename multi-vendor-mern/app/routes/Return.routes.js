import { Router } from 'express';
import * as returnController from '../controllers/Return.controller.js';
import { uploadProductImages } from '../helpers/FileUpload.helper.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', returnController.createReturn);
router.get('/mine', returnController.getMyReturns);
router.post('/upload-image', uploadProductImages, returnController.uploadReturnImage);
router.put('/:id/tracking', authenticate, returnController.updateTracking);
// Seller
router.get('/seller', requireRole('Seller'), returnController.getSellerReturns);
router.put('/:id/seller-decision', requireRole('Seller'), returnController.sellerDecision);
router.put('/:id/process-refund', requireRole('Seller'), returnController.processRefund);

// Admin
router.get('/admin', requireRole('Admin'), returnController.getAdminReturns);
router.put('/:id/admin-decision', requireRole('Admin'), returnController.adminDecision);
export default router;
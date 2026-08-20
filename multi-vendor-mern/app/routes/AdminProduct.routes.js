import { Router } from 'express';
import * as adminProductController from '../controllers/AdminProduct.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate, requireRole('Admin'));

router.get('/', adminProductController.getAllProducts);
router.get('/stats', adminProductController.getProductStats);
router.get('/:id', adminProductController.getProductById);
router.put('/:id/status', adminProductController.updateProductStatus);
router.get('/:id/moderation-status', adminProductController.getProductModerationStatus);
router.post('/:id/warn', adminProductController.warnProduct);

export default router;
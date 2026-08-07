import { Router } from 'express';
import * as adminProductController from '../controllers/AdminProduct.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();
router.use((req, res, next) => {
  console.log('🟢 AdminProduct route matched');
  next();
});
router.use(authenticate, requireRole('Admin'));

router.get('/', adminProductController.getAllProducts);
router.get('/:id', adminProductController.getProductById);
router.put('/:id/status', adminProductController.updateProductStatus);

export default router;
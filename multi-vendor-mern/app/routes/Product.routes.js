import { Router } from 'express';
import * as productController from '../controllers/Product.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate, requireRole('Seller'));

router.post('/', productController.createProduct);
router.get('/', productController.getMyProducts);
router.put('/:id', productController.updateMyProduct);
router.delete('/:id', productController.deleteMyProduct);

export default router;
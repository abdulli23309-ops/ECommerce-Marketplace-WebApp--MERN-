import { Router } from 'express';
import * as productController from '../controllers/Product.controller.js';
import { authenticate, requireRole, requirePermission } from '../middleware/Auth.middleware.js';
import { createProductValidation, updateProductValidation } from '../validations/Product.validation.js';
import { validateRequest } from '../middleware/Validation.middleware.js';
import { uploadProductImages } from '../helpers/FileUpload.helper.js';

const router = Router();

// All routes require authentication + Seller role
router.use(authenticate, requireRole('Seller'));
router.post('/upload-image', uploadProductImages, productController.uploadImage);
// Create product – also require the fine‑grained permission
router.post(
  '/',
  requirePermission('Seller.Products.Create'),
  uploadProductImages,
  createProductValidation,
  validateRequest,
  productController.createProduct
);

// Update product – require edit permission
router.put(
  '/:id',
  requirePermission('Seller.Products.Edit'),
  uploadProductImages,
  updateProductValidation,
  validateRequest,
  productController.updateMyProduct
);

router.get('/', productController.getMyProducts);

// Delete product – require delete permission
router.delete(
  '/:id',
  requirePermission('Seller.Products.Delete'),
  productController.deleteMyProduct
);
router.get('/:id', productController.getMyProductById);

export default router;
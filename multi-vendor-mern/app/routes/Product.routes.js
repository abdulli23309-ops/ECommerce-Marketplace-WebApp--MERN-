import { Router } from 'express';
import * as productController from '../controllers/Product.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';
import { createProductValidation, updateProductValidation } from '../validations/Product.validation.js';
import { validateRequest } from '../middleware/Validation.middleware.js';
import { uploadProductImages } from '../helpers/FileUpload.helper.js';

const router = Router();

router.use(authenticate, requireRole('Seller'));

// Multer handles multipart/form-data, then validation, then controller
router.post('/', uploadProductImages, createProductValidation, validateRequest, productController.createProduct);
router.put('/:id', uploadProductImages, updateProductValidation, validateRequest, productController.updateMyProduct);

router.get('/', productController.getMyProducts);
router.delete('/:id', productController.deleteMyProduct);

export default router;
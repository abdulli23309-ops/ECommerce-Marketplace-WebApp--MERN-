import { Router } from 'express';
import * as ctrl from '../controllers/Brand.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';
import { validateRequest } from '../middleware/Validation.middleware.js';
import { createBrandValidation, updateBrandValidation } from '../validations/Brand.validation.js';

const router = Router();

router.get('/', ctrl.getAllBrands);
router.post('/', authenticate, requireRole('Admin'), createBrandValidation, validateRequest, ctrl.createBrand);
router.put('/:id', authenticate, requireRole('Admin'), updateBrandValidation, validateRequest, ctrl.updateBrand);
router.delete('/:id', authenticate, requireRole('Admin'), ctrl.deleteBrand);

export default router;
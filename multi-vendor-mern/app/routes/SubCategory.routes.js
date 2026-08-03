import { Router } from 'express';
import * as ctrl from '../controllers/SubCategory.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';
import { validateRequest } from '../middleware/Validation.middleware.js';
import { createSubCategoryValidation, updateSubCategoryValidation } from '../validations/SubCategory.validation.js';

const router = Router();

router.get('/', ctrl.getAllSubCategories);
router.post('/', authenticate, requireRole('Admin'), createSubCategoryValidation, validateRequest, ctrl.createSubCategory);
router.put('/:id', authenticate, requireRole('Admin'), updateSubCategoryValidation, validateRequest, ctrl.updateSubCategory);
router.delete('/:id', authenticate, requireRole('Admin'), ctrl.deleteSubCategory);

export default router;
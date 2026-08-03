import { Router } from 'express';
import * as categoryController from '../controllers/Category.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';
import { validateRequest } from '../middleware/Validation.middleware.js';
import { createCategoryValidation, updateCategoryValidation } from '../validations/Category.validation.js';

const router = Router();

// Admin only for create/update/delete
router.post('/', authenticate, requireRole('Admin'), createCategoryValidation, validateRequest, categoryController.createCategory);
router.put('/:id', authenticate, requireRole('Admin'), updateCategoryValidation, validateRequest, categoryController.updateCategory);
router.delete('/:id', authenticate, requireRole('Admin'), categoryController.deleteCategory);

// Public or any authenticated user can view
router.get('/', categoryController.getAllCategories);

export default router;
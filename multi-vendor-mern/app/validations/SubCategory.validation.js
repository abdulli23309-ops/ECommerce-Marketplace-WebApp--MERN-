import { body } from 'express-validator';

export const createSubCategoryValidation = [
  body('name').trim().notEmpty().withMessage('SubCategory name is required'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('image').optional().isURL().withMessage('Image must be a valid URL'),
];

export const updateSubCategoryValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('category').optional().isMongoId().withMessage('Valid category ID'),
  body('image').optional().isURL().withMessage('Image must be a valid URL'),
  body('isActive').optional().isBoolean(),
];
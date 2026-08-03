import { body } from 'express-validator';

export const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required'),
  body('description')
    .optional()
    .trim(),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
];

export const updateCategoryValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty'),
  body('description')
    .optional()
    .trim(),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false'),
];
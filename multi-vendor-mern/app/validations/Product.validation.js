import { body } from 'express-validator';

export const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body('description')
    .optional()
    .trim(),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('subCategory')
    .isMongoId()
    .withMessage('Valid sub-category ID is required'),
  body('brand')
    .optional()
    .isMongoId()
    .withMessage('Brand ID must be a valid MongoDB ID'),
  body('images')
    .optional()
    .isArray({ min: 0 })
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty'),
  body('description')
    .optional()
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('subCategory')
    .optional()
    .isMongoId()
    .withMessage('Invalid sub-category ID'),
  body('brand')
    .optional()
    .isMongoId()
    .withMessage('Invalid brand ID'),
  body('images')
    .optional()
    .isArray({ min: 0 })
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];
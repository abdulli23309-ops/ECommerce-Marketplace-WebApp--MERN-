import { body } from 'express-validator';

export const createBrandValidation = [
  body('name').trim().notEmpty().withMessage('Brand name is required'),
  body('image').optional().isURL().withMessage('Image must be a valid URL'),
];

export const updateBrandValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('image').optional().isURL(),
  body('isActive').optional().isBoolean(),
];
import { body } from 'express-validator';

export const createStoreValidation = [
  body('name').trim().notEmpty().withMessage('Store name is required'),
];

export const updateStoreValidation = [
  body('name').optional().trim().notEmpty().withMessage('Store name cannot be empty'),
  body('description').optional().trim(),
  body('logo').optional().isURL().withMessage('Logo must be a valid URL'),
];
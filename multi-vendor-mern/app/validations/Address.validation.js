import { body } from 'express-validator';

export const createAddressValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('street').trim().notEmpty().withMessage('Street is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
];

export const updateAddressValidation = [
  body('fullName').optional().trim().notEmpty(),
  body('phoneNumber').optional().trim().notEmpty(),
  body('street').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  body('state').optional().trim().notEmpty(),
  body('postalCode').optional().trim().notEmpty(),
  body('country').optional().trim().notEmpty(),
  body('isDefault').optional().isBoolean(),
];
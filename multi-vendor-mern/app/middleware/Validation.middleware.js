import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.util.js';

const validateRequest = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map(({ path, msg }) => ({ field: path, message: msg }));
  return next(new ApiError(400, 'Validation failed', errors));
};

export { validateRequest };

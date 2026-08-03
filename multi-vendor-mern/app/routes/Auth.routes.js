import { Router } from 'express';
import * as authController from '../controllers/Auth.controller.js';
import { validateRequest } from '../middleware/Validation.middleware.js';
import { loginValidation, logoutValidation, refreshTokenValidation, registerValidation } from '../validations/Auth.validation.js';

const router = Router();

router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/refresh-token', refreshTokenValidation, validateRequest, authController.refreshToken);
router.post('/logout', logoutValidation, validateRequest, authController.logout);

export default router;

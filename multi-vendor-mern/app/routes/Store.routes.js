import { Router } from 'express';
import * as storeController from '../controllers/Store.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';
import { validateRequest } from '../middleware/Validation.middleware.js';
import { createStoreValidation, updateStoreValidation } from '../validations/Store.validation.js';

const router = Router();

// All store routes require authentication + Seller role
router.use(authenticate, requireRole('Seller'));

router.post('/', createStoreValidation, validateRequest, storeController.createStore);
router.get('/mine', storeController.getMyStore);
router.put('/mine', updateStoreValidation, validateRequest, storeController.updateMyStore);

export default router;
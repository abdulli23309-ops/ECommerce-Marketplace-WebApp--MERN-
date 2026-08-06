import { Router } from 'express';
import * as storeController from '../controllers/Store.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';
import { validateRequest } from '../middleware/Validation.middleware.js';
import { createStoreValidation, updateStoreValidation } from '../validations/Store.validation.js';
import { uploadProductImages } from '../helpers/FileUpload.helper.js';

const router = Router();

// Store creation during seller onboarding – only requires authentication
router.post('/', authenticate, uploadProductImages, createStoreValidation, validateRequest, storeController.createStore);
// All other store routes require the Seller role
router.use(authenticate, requireRole('Seller'));
router.get('/mine', storeController.getMyStore);
router.put('/mine', updateStoreValidation, validateRequest, storeController.updateMyStore);
router.delete('/mine', storeController.deleteMyStore);

export default router;
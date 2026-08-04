import { Router } from 'express';
import * as storeController from '../controllers/Store.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';
import { validateRequest } from '../middleware/Validation.middleware.js';
import { createStoreValidation, updateStoreValidation } from '../validations/Store.validation.js';

const router = Router();

router.use(authenticate, requireRole('Seller'));

router.post('/', createStoreValidation, validateRequest, storeController.createStore);
router.get('/mine', storeController.getMyStores);               // now returns array
router.put('/:id', updateStoreValidation, validateRequest, storeController.updateStore); // by ID
router.delete('/:id', storeController.deleteStore);             // by ID

export default router;
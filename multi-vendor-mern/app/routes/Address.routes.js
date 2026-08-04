import { Router } from 'express';
import * as addressController from '../controllers/Address.controller.js';
import { authenticate } from '../middleware/Auth.middleware.js';
import { validateRequest } from '../middleware/Validation.middleware.js';
import {
  createAddressValidation,
  updateAddressValidation,
} from '../validations/Address.validation.js';

const router = Router();

router.use(authenticate); // All routes require a logged-in user

router.get('/', addressController.getAddresses);
router.post('/', createAddressValidation, validateRequest, addressController.createAddress);
router.put('/:id', updateAddressValidation, validateRequest, addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.put('/:id/default', addressController.setDefaultAddress);

export default router;
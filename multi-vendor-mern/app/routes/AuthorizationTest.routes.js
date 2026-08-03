import { Router } from 'express';
import * as authorizationTestController from '../controllers/AuthorizationTest.controller.js';
import { authenticate, requirePermission, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

router.get('/authenticated', authenticate, authorizationTestController.authenticated);
router.get('/seller', authenticate, requireRole('Seller'), authorizationTestController.seller);
router.get('/admin', authenticate, requireRole('Admin'), authorizationTestController.admin);
router.get(
  '/products-create',
  authenticate,
  requirePermission('Products.Create'),
  authorizationTestController.productsCreate
);

export default router;

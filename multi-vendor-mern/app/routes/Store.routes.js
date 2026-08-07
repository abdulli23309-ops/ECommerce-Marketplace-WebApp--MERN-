import { Router } from 'express';
import * as storeController from '../controllers/Store.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

// ---------- SELLER AUTHENTICATED ROUTES (must come first to avoid /:id conflict) ----------
router.use(authenticate, requireRole('Seller'));

// GET /stores/mine – must be before /:id
router.get('/mine', storeController.getMyStore);

// PUT /stores/mine
router.put('/mine', storeController.updateMyStore);

// DELETE /stores/mine
router.delete('/mine', storeController.deleteMyStore);

// ---------- PUBLIC ROUTE ----------
router.get('/:id', storeController.getPublicStore);

export default router;
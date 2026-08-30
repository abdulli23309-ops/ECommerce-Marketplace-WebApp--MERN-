import { Router } from 'express';
import * as storeController from '../controllers/Store.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

// ---------- SELLER AUTHENTICATED ROUTES (must come before /:id to avoid /:id conflict) ----------
// Guards are applied per-route (not via router.use) so the public GET /:id
// below is not blocked by authentication/role checks.
const sellerGuard = [authenticate, requireRole('Seller')];

// GET /stores/mine – must be before /:id
router.get('/mine', ...sellerGuard, storeController.getMyStore);

// PUT /stores/mine
router.put('/mine', ...sellerGuard, storeController.updateMyStore);

// DELETE /stores/mine
router.delete('/mine', ...sellerGuard, storeController.deleteMyStore);

// ---------- PUBLIC ROUTE ----------
router.get('/:id', storeController.getPublicStore);

export default router;
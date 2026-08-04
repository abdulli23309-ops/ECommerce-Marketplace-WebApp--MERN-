import { Router } from 'express';
import * as wishlistController from '../controllers/Wishlist.controller.js';
import { authenticate } from '../middleware/Auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', wishlistController.getWishlist);
router.post('/items', wishlistController.addProduct);
router.delete('/items', wishlistController.removeProduct);
router.delete('/', wishlistController.clearWishlist);

export default router;
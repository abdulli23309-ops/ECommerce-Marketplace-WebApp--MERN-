import { Router } from 'express';
import * as cartController from '../controllers/Cart.controller.js';
import { authenticate } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items', cartController.updateItemQuantity);
router.delete('/items', cartController.removeItem);
router.delete('/', cartController.clearCart);

export default router;
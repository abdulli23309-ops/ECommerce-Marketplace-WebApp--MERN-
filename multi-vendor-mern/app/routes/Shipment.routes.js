import { Router } from 'express';
import * as shipmentController from '../controllers/Shipment.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate, requireRole('Seller'));

router.post('/', shipmentController.createShipment);
router.get('/:sellerOrderId', shipmentController.getShipment);
router.put('/:id/status', shipmentController.updateShipmentStatus);

export default router;
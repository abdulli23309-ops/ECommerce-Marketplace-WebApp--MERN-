import { Router } from 'express';
import * as shipmentController from '../controllers/Shipment.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

// All shipment routes require Seller authentication
router.use(authenticate, requireRole('Seller'));

router.post('/', shipmentController.createShipment);              // create
router.get('/:sellerOrderId', shipmentController.getShipment);   // get by sellerOrderId
router.put('/:id', shipmentController.updateShipmentInfo);       // update carrier/tracking
router.put('/:id/status', shipmentController.updateShipmentStatus); // update status

export default router;
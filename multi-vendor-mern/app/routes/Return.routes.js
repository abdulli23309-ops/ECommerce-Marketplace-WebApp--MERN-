import { Router } from 'express';
import * as returnController from '../controllers/Return.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate);

// Customer routes
router.post('/', returnController.createReturn);
router.get('/mine', returnController.getMyReturns);

// Admin route
router.put('/:id/process', requireRole('Admin'), returnController.processReturn);

export default router;
import { Router } from 'express';
import * as auditLogController from '../controllers/AdminAuditLog.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate, requireRole('Admin'));
router.get('/', auditLogController.getAuditLogs);

export default router;
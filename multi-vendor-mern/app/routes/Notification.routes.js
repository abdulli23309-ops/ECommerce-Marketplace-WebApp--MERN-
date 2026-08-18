import { Router } from 'express';
import * as notificationController from '../controllers/Notification.controller.js';
import { authenticate } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
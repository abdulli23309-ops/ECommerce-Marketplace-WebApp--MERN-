import { Router } from 'express';
import * as adminController from '../controllers/Admin.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();

router.use(authenticate, requireRole('Admin'));

// Users
router.get('/users', adminController.getUsers);
router.put('/users/:id/activate', adminController.activateUser);
router.put('/users/:id/deactivate', adminController.deactivateUser);

// Sellers
router.get('/sellers', adminController.getSellers);
router.put('/sellers/:id/approve', adminController.approveSeller);
router.put('/sellers/:id/reject', adminController.rejectSeller);
router.get('/sellers/:id/moderation-status', adminController.getSellerModerationStatus);
router.post('/sellers/:id/warn', adminController.warnSeller);

// Orders
router.get('/orders', adminController.getOrders);

// Payments
router.get('/payments', adminController.getPayments);

// Shipments
router.get('/shipments', adminController.getShipments);

// Returns
router.get('/returns', adminController.getReturns);
router.put('/returns/:id/process', adminController.processReturn);

// Refunds
router.get('/refunds', adminController.getRefunds);
router.post('/refunds', adminController.createRefund);

// Permission Groups
router.get('/permission-groups', adminController.getPermissionGroups);
router.post('/permission-groups', adminController.createPermissionGroup);
router.put('/permission-groups/:id', adminController.updatePermissionGroup);
router.delete('/permission-groups/:id', adminController.deletePermissionGroup);
router.get('/permission-groups/:id/permissions', adminController.getGroupPermissions);

// Roles
router.get('/roles', adminController.getRoles);
router.get('/roles/:id', adminController.getRoleById);
router.put('/roles/:roleId/groups/:groupId', adminController.assignGroupToRole);
router.delete('/roles/:roleId/groups/:groupId', adminController.removeGroupFromRole);

// Permissions
router.get('/permissions', adminController.getPermissions);

// Dashboard stats
router.get('/stats', adminController.getStats);

export default router;
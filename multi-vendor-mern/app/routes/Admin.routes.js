import { Router } from 'express';
import * as adminController from '../controllers/Admin.controller.js';
import * as adminManagementController from '../controllers/Admin.management.controller.js';
import * as adminPermissionController from '../controllers/Admin.permission.controller.js';
import { authenticate, requireRole } from '../middleware/Auth.middleware.js';

const router = Router();
router.use(authenticate, requireRole('Admin'));

router.get('/stats', adminController.getStats);

// Users
router.get('/users', adminManagementController.getUsers);
router.put('/users/:id/activate', adminManagementController.activateUser);
router.put('/users/:id/deactivate', adminManagementController.deactivateUser);

// Sellers
router.get('/sellers', adminManagementController.getSellers);
router.put('/sellers/:id/approve', adminManagementController.approveSeller);
router.put('/sellers/:id/reject', adminManagementController.rejectSeller);

// Products
router.get('/products', adminManagementController.getAllProducts);
router.put('/products/:id/status', adminManagementController.updateProductStatus);

// Orders
router.get('/orders', adminManagementController.getAllParentOrders);
router.get('/seller-orders', adminManagementController.getAllSellerOrders);

// Payments
router.get('/payments', adminManagementController.getAllPayments);

// Shipments
router.get('/shipments', adminManagementController.getAllShipments);

// Returns
router.get('/returns', adminManagementController.getAllReturns);

// Refunds
router.get('/refunds', adminManagementController.getAllRefunds);

// Permission Groups
router.get('/permission-groups', adminPermissionController.getGroups);
router.post('/permission-groups', adminPermissionController.createGroup);
router.put('/permission-groups/:id', adminPermissionController.updateGroup);
router.delete('/permission-groups/:id', adminPermissionController.deleteGroup);

// Permissions
router.get('/permissions', adminPermissionController.getPermissions);
router.post('/permissions', adminPermissionController.createPermission);
router.put('/permissions/:id', adminPermissionController.updatePermission);
router.delete('/permissions/:id', adminPermissionController.deletePermission);

// Role-Group assignments
router.put('/roles/:roleId/groups/:groupId', adminPermissionController.assignGroupToRole);
router.delete('/roles/:roleId/groups/:groupId', adminPermissionController.removeGroupFromRole);

export default router;

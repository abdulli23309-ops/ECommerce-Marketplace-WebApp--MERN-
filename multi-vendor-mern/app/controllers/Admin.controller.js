import * as adminService from '../services/Admin.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

// Users
export const getUsers = asyncHandler(async (req, res) => {
  const data = await adminService.getUsers(req.query);
  new ApiResponse(200, data, 'Users retrieved').send(res);
});
export const activateUser = asyncHandler(async (req, res) => {
  const user = await adminService.activateUser(req.params.id, req.user.id);
  new ApiResponse(200, user, 'User activated').send(res);
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await adminService.deactivateUser(req.params.id, req.user.id);
  new ApiResponse(200, user, 'User deactivated').send(res);
});

// Sellers
export const getSellers = asyncHandler(async (req, res) => {
  const data = await adminService.getSellers(req.query);
  new ApiResponse(200, data, 'Sellers retrieved').send(res);
});
export const approveSeller = asyncHandler(async (req, res) => {
  const profile = await adminService.approveSeller(req.params.id);
  new ApiResponse(200, profile, 'Seller approved').send(res);
});
export const rejectSeller = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  await adminService.rejectSeller(req.params.id, reason);
  new ApiResponse(200, null, 'Seller rejected').send(res);
});

// Orders
export const getOrders = asyncHandler(async (req, res) => {
  const data = await adminService.getOrders(req.query);
  new ApiResponse(200, data, 'Orders retrieved').send(res);
});

// Payments
export const getPayments = asyncHandler(async (req, res) => {
  const data = await adminService.getPayments(req.query);
  new ApiResponse(200, data, 'Payments retrieved').send(res);
});

// Shipments
export const getShipments = asyncHandler(async (req, res) => {
  const data = await adminService.getShipments(req.query);
  new ApiResponse(200, data, 'Shipments retrieved').send(res);
});

// Returns
export const getReturns = asyncHandler(async (req, res) => {
  const data = await adminService.getReturns(req.query);
  new ApiResponse(200, data, 'Returns retrieved').send(res);
});
export const processReturn = asyncHandler(async (req, res) => {
  const { decision, reason } = req.body;   // frontend may send 'reason' as adminNotes
  const returnReq = await adminService.adminDecision(
    req.params.id,
    decision,
    req.user.id,
    reason
  );
  new ApiResponse(200, returnReq, 'Return processed').send(res);
});

// Refunds
export const getRefunds = asyncHandler(async (req, res) => {
  const data = await adminService.getRefunds(req.query);
  new ApiResponse(200, data, 'Refunds retrieved').send(res);
});
export const createRefund = asyncHandler(async (req, res) => {
  const { returnRequestId } = req.body;
  const refund = await adminService.createRefund(returnRequestId, req.user.id);
  new ApiResponse(201, refund, 'Refund created').send(res);
});
export const getPermissionGroups = asyncHandler(async (req, res) => {
  const data = await adminService.getPermissionGroups(req.query);
  new ApiResponse(200, data, 'Groups retrieved').send(res);
});
// Permission Groups
export const getGroupPermissions = asyncHandler(async (req, res) => {
  const permissions = await adminService.getGroupPermissions(req.params.id);
  new ApiResponse(200, permissions, 'Group permissions retrieved').send(res);
});
export const createPermissionGroup = asyncHandler(async (req, res) => {
  const group = await adminService.createPermissionGroup(req.body);
  new ApiResponse(201, group, 'Group created').send(res);
});
export const updatePermissionGroup = asyncHandler(async (req, res) => {
  const group = await adminService.updatePermissionGroup(req.params.id, req.body);
  new ApiResponse(200, group, 'Group updated').send(res);
});
export const deletePermissionGroup = asyncHandler(async (req, res) => {
  await adminService.deletePermissionGroup(req.params.id);
  new ApiResponse(200, null, 'Group deleted').send(res);
});

// Roles
export const getRoles = asyncHandler(async (req, res) => {
  const data = await adminService.getRoles(req.query);
  new ApiResponse(200, data, 'Roles retrieved').send(res);
});
export const assignGroupToRole = asyncHandler(async (req, res) => {
  const result = await adminService.assignGroupToRole(req.params.roleId, req.params.groupId);
  new ApiResponse(200, result, 'Group assigned').send(res);
});
export const removeGroupFromRole = asyncHandler(async (req, res) => {
  const result = await adminService.removeGroupFromRole(req.params.roleId, req.params.groupId);
  new ApiResponse(200, result, 'Group removed').send(res);
});

// Dashboard stats
export const getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStats();
  new ApiResponse(200, stats, 'Stats retrieved').send(res);
});
export const getPermissions = asyncHandler(async (req, res) => {
  const permissions = await adminService.getPermissions();
  new ApiResponse(200, permissions, 'Permissions retrieved').send(res);
});

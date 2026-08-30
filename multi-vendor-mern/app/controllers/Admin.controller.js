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
  const profile = await adminService.approveSeller(req.params.id, req.user.id);
  new ApiResponse(200, profile, 'Seller approved').send(res);
});

export const rejectSeller = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  await adminService.rejectSeller(req.params.id, reason, req.user.id);
  new ApiResponse(200, null, 'Seller rejected').send(res);
});

export const getSellerModerationStatus = asyncHandler(async (req, res) => {
  const status = await adminService.getSellerModerationStatus(req.params.id);
  new ApiResponse(200, status, 'Seller moderation status retrieved').send(res);
});

export const warnSeller = asyncHandler(async (req, res) => {
  const seller = await adminService.warnSeller(
    req.params.id,
    req.body.reason,
    req.user.id
  );
  new ApiResponse(200, seller, 'Seller warning issued').send(res);
});

export const suspendSeller = asyncHandler(async (req, res) => {
  const result = await adminService.suspendSeller(
    req.params.id,
    {
      reason: req.body.reason,
      internalNote: req.body.internalNote,
    },
    req.user.id
  );
  new ApiResponse(200, result, 'Seller suspended').send(res);
});

export const reinstateSeller = asyncHandler(async (req, res) => {
  const profile = await adminService.reinstateSeller(req.params.id, req.user.id);
  new ApiResponse(200, profile, 'Seller reinstated').send(res);
});

export const getSellerTimeline = asyncHandler(async (req, res) => {
  const timeline = await adminService.getSellerTimeline(req.params.id);
  new ApiResponse(200, timeline, 'Seller moderation timeline retrieved').send(res);
});

// Appeals dashboard
export const getSellerAppeals = asyncHandler(async (req, res) => {
  const data = await adminService.getAppealsForAdmin(req.query.status);
  new ApiResponse(200, data, 'Seller appeals retrieved').send(res);
});

export const decideSellerAppeal = asyncHandler(async (req, res) => {
  const { decision, decisionReason } = req.body;
  const appeal = await adminService.decideAppeal(
    req.params.id,
    decision,
    decisionReason,
    req.user.id
  );
  new ApiResponse(200, appeal, 'Appeal decision recorded').send(res);
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
  const { status, decision, reason } = req.body;

  // Accept either status directly or decision from UI
  const finalStatus =
    status ||
    (decision === 'APPROVE'
      ? 'APPROVED'
      : decision === 'REJECT'
        ? 'REJECTED'
        : decision);

  const result = await adminService.processReturn(
    req.params.id,
    finalStatus,
    req.user.id,
    reason
  );

  new ApiResponse(200, result, 'Return processed').send(res);
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

// Permission Groups
export const getPermissionGroups = asyncHandler(async (req, res) => {
  const data = await adminService.getPermissionGroups(req.query);
  new ApiResponse(200, data, 'Groups retrieved').send(res);
});

export const getGroupPermissions = asyncHandler(async (req, res) => {
  const permissions = await adminService.getGroupPermissions(req.params.id);
  new ApiResponse(200, permissions, 'Group permissions retrieved').send(res);
});

export const createPermissionGroup = asyncHandler(async (req, res) => {
  const group = await adminService.createPermissionGroup(req.body, req.user.id);
  new ApiResponse(201, group, 'Group created').send(res);
});

export const updatePermissionGroup = asyncHandler(async (req, res) => {
  const group = await adminService.updatePermissionGroup(
    req.params.id,
    req.body,
    req.user.id
  );
  new ApiResponse(200, group, 'Group updated').send(res);
});

export const deletePermissionGroup = asyncHandler(async (req, res) => {
  await adminService.deletePermissionGroup(req.params.id, req.user.id);
  new ApiResponse(200, null, 'Group deleted').send(res);
});

// Roles
export const getRoles = asyncHandler(async (req, res) => {
  const data = await adminService.getRoles(req.query);
  new ApiResponse(200, data, 'Roles retrieved').send(res);
});

export const getRoleById = asyncHandler(async (req, res) => {
  const role = await adminService.getRoleById(req.params.id);
  new ApiResponse(200, role, 'Role retrieved').send(res);
});

export const assignGroupToRole = asyncHandler(async (req, res) => {
  const role = await adminService.assignGroupToRole(
    req.params.roleId,
    req.params.groupId,
    req.user.id
  );
  new ApiResponse(200, role, 'Group assigned').send(res);
});

export const removeGroupFromRole = asyncHandler(async (req, res) => {
  const role = await adminService.removeGroupFromRole(
    req.params.roleId,
    req.params.groupId,
    req.user.id
  );
  new ApiResponse(200, role, 'Group removed').send(res);
});

// Permissions
export const getPermissions = asyncHandler(async (req, res) => {
  const permissions = await adminService.getPermissions();
  new ApiResponse(200, permissions, 'Permissions retrieved').send(res);
});

// Dashboard stats
export const getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStats();
  new ApiResponse(200, stats, 'Stats retrieved').send(res);
});
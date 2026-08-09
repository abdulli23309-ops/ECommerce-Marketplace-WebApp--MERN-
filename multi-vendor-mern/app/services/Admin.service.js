import * as adminRepo from '../repositories/Admin.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

// ---------------- Users ----------------
export const getUsers = (query) => adminRepo.findUsers(query);
export const activateUser = (id) => adminRepo.activateUser(id);
export const deactivateUser = (id) => adminRepo.deactivateUser(id);

// ---------------- Sellers ----------------
export const getSellers = (query) => adminRepo.findSellers(query);
export const approveSeller = (id) => adminRepo.approveSeller(id);
export const rejectSeller = (id, reason) => adminRepo.rejectSeller(id, reason);

// ---------------- Orders ----------------
export const getOrders = (query) => adminRepo.findOrders(query);

// ---------------- Payments ----------------
export const getPayments = (query) => adminRepo.findPayments(query);

// ---------------- Shipments ----------------
export const getShipments = (query) => adminRepo.findShipments(query);

// ---------------- Returns ----------------
export const getReturns = (query) => adminRepo.findReturns(query);
export const processReturn = (id, status, adminId, reason) =>
  adminRepo.processReturn(id, status, adminId, reason);

// ---------------- Refunds ----------------
export const getRefunds = (query) => adminRepo.findRefunds(query);
export const createRefund = (returnRequestId, adminId) =>
  adminRepo.createRefund(returnRequestId, adminId);

// ---------------- Permission Groups ----------------
export const getPermissionGroups = (query) => adminRepo.findPermissionGroups(query);
export const createPermissionGroup = (data) => adminRepo.createPermissionGroup(data);
export const updatePermissionGroup = (id, data) => adminRepo.updatePermissionGroup(id, data);
export const deletePermissionGroup = (id) => adminRepo.deletePermissionGroup(id);

// ---------------- Roles (for assignment) ----------------
export const getRoles = (query) => adminRepo.findRoles(query);
export const assignGroupToRole = (roleId, groupId) => adminRepo.assignGroupToRole(roleId, groupId);
export const removeGroupFromRole = (roleId, groupId) => adminRepo.removeGroupFromRole(roleId, groupId);

// ---------------- Stats ----------------
export const getStats = () => adminRepo.getStats();

// ---------------- Permissions (new) ----------------
export const getPermissions = () => adminRepo.findAllPermissions();  // ← new
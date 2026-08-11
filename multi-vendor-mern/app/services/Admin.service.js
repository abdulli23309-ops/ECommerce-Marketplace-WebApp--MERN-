import * as adminRepo from '../repositories/Admin.repository.js';
import User from '../models/User.model.js';
import Store from '../models/Store.model.js';
import SellerProfile from '../models/SellerProfile.model.js';
import { ApiError } from '../utils/ApiError.util.js';
import PermissionGroup from '../models/PermissionGroup.model.js';

// ---------------- Users ----------------
export const getUsers = (query) => adminRepo.findUsers(query);

export const activateUser = async (id, adminId) => {
  if (id.toString() === adminId.toString()) {
    throw new ApiError(403, 'You cannot modify your own account');
  }
  return User.findByIdAndUpdate(id, { isActive: true }, { new: true }).lean();
};

export const deactivateUser = async (id, adminId) => {
  if (id.toString() === adminId.toString()) {
    throw new ApiError(403, 'You cannot modify your own account');
  }
  return User.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
};

// ---------------- Sellers ----------------
export const getSellers = (query) => adminRepo.findSellers(query);

export const approveSeller = async (id) => {
  const profile = await SellerProfile.findByIdAndUpdate(
    id,
    { status: 'Approved', approvedAt: new Date() },
    { new: true }
  );
  if (!profile) throw new ApiError(404, 'Seller profile not found');

  // Reactivate the store
  await Store.findOneAndUpdate(
    { sellerProfile: profile._id },
    { isActive: true }
  );

  // Replace role with Seller
  await User.findByIdAndUpdate(profile.user, { role: 'Seller' });

  return profile;
};

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
export const updatePermissionGroup = (id, data) => {
  const updateData = { ...data };
  if (data.permissionIds) {
    updateData.permissions = data.permissionIds;
    delete updateData.permissionIds;
  }
  return adminRepo.updatePermissionGroup(id, updateData);
};
export const deletePermissionGroup = (id) => adminRepo.deletePermissionGroup(id);

// ---------------- Roles ----------------
export const getRoles = (query) => adminRepo.findRoles(query);
export const assignGroupToRole = (roleId, groupId) => adminRepo.assignGroupToRole(roleId, groupId);
export const removeGroupFromRole = (roleId, groupId) => adminRepo.removeGroupFromRole(roleId, groupId);

// ---------------- Stats ----------------
export const getStats = () => adminRepo.getStats();

// ---------------- Permissions ----------------
export const getPermissions = () => adminRepo.findAllPermissions();
export const getGroupPermissions = async (groupId) => {
  const group = await PermissionGroup.findById(groupId)
    .select('permissions')
    .lean();

  if (!group) throw new ApiError(404, 'Permission group not found');
  return group.permissions;   // array of ObjectIds
};
export const adminDecision = (returnId, decision, adminId, notes) =>
  returnService.adminDecision(returnId, decision, adminId, notes);
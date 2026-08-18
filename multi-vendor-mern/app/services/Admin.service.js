import * as adminRepo from '../repositories/Admin.repository.js';
import User from '../models/User.model.js';
import Store from '../models/Store.model.js';
import SellerProfile from '../models/SellerProfile.model.js';
import Product from '../models/Product.model.js';
import { ApiError } from '../utils/ApiError.util.js';
import PermissionGroup from '../models/PermissionGroup.model.js';
import { logAction } from './AdminAuditLog.service.js';

// ---------------- Users ----------------
export const getUsers = (query) => adminRepo.findUsers(query);

export const activateUser = async (id, adminId) => {
  if (id.toString() === adminId.toString()) {
    throw new ApiError(403, 'You cannot modify your own account');
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  ).lean();

  if (!user) throw new ApiError(404, 'User not found');

  if (user.role === 'Seller') {
    const sellerProfile = await SellerProfile.findOne({ user: id });
    if (sellerProfile) {
      const store = await Store.findOne({ sellerProfile: sellerProfile._id });
      if (store) {
        await Store.findByIdAndUpdate(store._id, { isActive: true });
        await Product.updateMany(
          { store: store._id, isDeleted: false, status: 'Suspended' },
          { status: 'Approved' }
        );
      }
    }
  }

  if (adminId) {
    await logAction(adminId, 'user.activate', 'User', id, { isActive: true });
  }

  return user;
};

export const deactivateUser = async (userId, adminId) => {
  if (userId.toString() === adminId.toString()) {
    throw new ApiError(403, 'You cannot modify your own account');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true }
  ).lean();

  if (!user) throw new ApiError(404, 'User not found');

  if (user.role === 'Seller') {
    const sellerProfile = await SellerProfile.findOne({ user: userId });
    if (sellerProfile) {
      const store = await Store.findOne({ sellerProfile: sellerProfile._id });
      if (store) {
        await Store.findByIdAndUpdate(store._id, { isActive: false });
        await Product.updateMany(
          { store: store._id, isDeleted: false },
          { status: 'Suspended' }
        );
      }
    }
  }

  if (adminId) {
    await logAction(adminId, 'user.deactivate', 'User', userId, { isActive: false });
  }

  return user;
};

// ---------------- Sellers ----------------
export const getSellers = (query) => adminRepo.findSellers(query);

export const approveSeller = async (id, adminId) => {
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

  if (adminId) {
    await logAction(adminId, 'seller.approve', 'SellerProfile', profile._id, {
      status: 'Approved',
      userId: profile.user,
    });
  }

  return profile;
};

export const rejectSeller = async (id, reason, adminId) => {
  const result = await adminRepo.rejectSeller(id, reason);

  if (adminId) {
    await logAction(adminId, 'seller.reject', 'SellerProfile', id, {
      reason,
    });
  }

  return result;
};

// ---------------- Orders ----------------
export const getOrders = (query) => adminRepo.findOrders(query);

// ---------------- Payments ----------------
export const getPayments = (query) => adminRepo.findPayments(query);

// ---------------- Shipments ----------------
export const getShipments = (query) => adminRepo.findShipments(query);

// ---------------- Returns ----------------
export const getReturns = (query) => adminRepo.findReturns(query);

export const processReturn = async (id, status, adminId, reason) => {
  const result = await adminRepo.processReturn(id, status, adminId, reason);

  if (adminId) {
    await logAction(adminId, 'return.process', 'Return', id, {
      status,
      reason,
    });
  }

  return result;
};

// ---------------- Refunds ----------------
export const getRefunds = (query) => adminRepo.findRefunds(query);

export const createRefund = async (returnRequestId, adminId) => {
  const refund = await adminRepo.createRefund(returnRequestId, adminId);

  if (adminId) {
    await logAction(adminId, 'refund.create', 'Refund', refund._id, {
      returnRequest: returnRequestId,
    });
  }

  return refund;
};

// ---------------- Permission Groups ----------------
export const getPermissionGroups = (query) => adminRepo.findPermissionGroups(query);

export const createPermissionGroup = async (data, adminId) => {
  const group = await adminRepo.createPermissionGroup(data);

  if (adminId) {
    await logAction(adminId, 'permission_group.create', 'PermissionGroup', group._id, {
      name: group.name,
    });
  }

  return group;
};

export const updatePermissionGroup = async (id, data, adminId) => {
  const updateData = { ...data };
  if (data.permissionIds) {
    updateData.permissions = data.permissionIds;
    delete updateData.permissionIds;
  }

  const group = await adminRepo.updatePermissionGroup(id, updateData);

  if (adminId) {
    await logAction(adminId, 'permission_group.update', 'PermissionGroup', id, data);
  }

  return group;
};

export const deletePermissionGroup = async (id, adminId) => {
  const result = await adminRepo.deletePermissionGroup(id);

  if (adminId) {
    await logAction(adminId, 'permission_group.delete', 'PermissionGroup', id);
  }

  return result;
};

// ---------------- Roles ----------------
export const getRoles = (query) => adminRepo.findRoles(query);

export const assignGroupToRole = async (roleId, groupId, adminId) => {
  const result = await adminRepo.assignGroupToRole(roleId, groupId);

  if (adminId) {
    await logAction(adminId, 'role.assign_group', 'Role', roleId, { groupId });
  }

  return result;
};

export const removeGroupFromRole = async (roleId, groupId, adminId) => {
  const result = await adminRepo.removeGroupFromRole(roleId, groupId);

  if (adminId) {
    await logAction(adminId, 'role.remove_group', 'Role', roleId, { groupId });
  }

  return result;
};

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


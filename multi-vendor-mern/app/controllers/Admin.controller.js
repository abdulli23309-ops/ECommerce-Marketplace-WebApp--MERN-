import * as adminService from '../services/Admin.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';
import { ApiError } from '../utils/ApiError.util.js';
import Role from '../models/Role.model.js';
import PermissionGroup from '../models/PermissionGroup.model.js';

export const getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStats();
  new ApiResponse(200, stats, 'Admin stats retrieved').send(res);
});

export const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().populate('permissions', 'name code').lean();
  new ApiResponse(200, roles, 'Roles retrieved').send(res);
});

export const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id)
    .populate('permissions', 'name code')
    .populate('permissionGroups', 'name')
    .lean();
  if (!role) throw new ApiError(404, 'Role not found');
  new ApiResponse(200, role, 'Role retrieved').send(res);
});
export const assignGroupToRole = asyncHandler(async (req, res) => {
  const role = await Role.findByIdAndUpdate(
    req.params.roleId,
    { $addToSet: { permissionGroups: req.params.groupId } },
    { new: true }
  );
  if (!role) throw new ApiError(404, 'Role not found');
  new ApiResponse(200, role, 'Group assigned to role').send(res);
});

export const removeGroupFromRole = asyncHandler(async (req, res) => {
  const role = await Role.findByIdAndUpdate(
    req.params.roleId,
    { $pull: { permissionGroups: req.params.groupId } },
    { new: true }
  );
  if (!role) throw new ApiError(404, 'Role not found');
  new ApiResponse(200, role, 'Group removed from role').send(res);
});
export const getGroupPermissions = asyncHandler(async (req, res) => {
  const group = await PermissionGroup.findById(req.params.id).lean();
  if (!group) throw new ApiError(404, 'Permission group not found');
  // Return array of permission IDs (strings)
  const permIds = (group.permissions || []).map(p => p.toString());
  new ApiResponse(200, permIds, 'Group permissions retrieved').send(res);
});
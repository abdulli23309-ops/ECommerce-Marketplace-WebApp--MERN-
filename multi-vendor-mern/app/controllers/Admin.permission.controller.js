import * as adminPermService from '../services/Admin.permission.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getGroups = asyncHandler(async (req, res) => {
  const groups = await adminPermService.getGroups();
  new ApiResponse(200, groups, 'Groups retrieved').send(res);
});
export const createGroup = asyncHandler(async (req, res) => {
  const group = await adminPermService.createGroup(req.body);
  new ApiResponse(201, group, 'Group created').send(res);
});
export const updateGroup = asyncHandler(async (req, res) => {
  const group = await adminPermService.updateGroup(req.params.id, req.body);
  new ApiResponse(200, group, 'Group updated').send(res);
});
export const deleteGroup = asyncHandler(async (req, res) => {
  await adminPermService.deleteGroup(req.params.id);
  new ApiResponse(200, null, 'Group deleted').send(res);
});

export const getPermissions = asyncHandler(async (req, res) => {
  const permissions = await adminPermService.getPermissions();
  new ApiResponse(200, permissions, 'Permissions retrieved').send(res);
});
export const createPermission = asyncHandler(async (req, res) => {
  const perm = await adminPermService.createPermission(req.body);
  new ApiResponse(201, perm, 'Permission created').send(res);
});
export const updatePermission = asyncHandler(async (req, res) => {
  const perm = await adminPermService.updatePermission(req.params.id, req.body);
  new ApiResponse(200, perm, 'Permission updated').send(res);
});
export const deletePermission = asyncHandler(async (req, res) => {
  await adminPermService.deletePermission(req.params.id);
  new ApiResponse(200, null, 'Permission deleted').send(res);
});

export const assignGroupToRole = asyncHandler(async (req, res) => {
  const role = await adminPermService.assignGroupToRole(req.params.roleId, req.params.groupId);
  new ApiResponse(200, role, 'Group assigned to role').send(res);
});
export const removeGroupFromRole = asyncHandler(async (req, res) => {
  const role = await adminPermService.removeGroupFromRole(req.params.roleId, req.params.groupId);
  new ApiResponse(200, role, 'Group removed from role').send(res);
});

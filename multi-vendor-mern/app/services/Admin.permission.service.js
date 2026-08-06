import Permission from '../models/Permission.model.js';
import PermissionGroup from '../models/PermissionGroup.model.js';
import Role from '../models/Role.model.js';
import { ApiError } from '../utils/ApiError.util.js';

// Groups
export const getGroups = () => PermissionGroup.find();
export const createGroup = (data) => {
  const { name, description, permissionIds } = data;
  return PermissionGroup.create({
    name,
    description,
    permissions: permissionIds || [],
  });
};
export const updateGroup = async (id, data) => {
  const update = {
    name: data.name,
  };
  // Only update permissions if permissionIds array is provided
  if (data.permissionIds) {
    update.permissions = data.permissionIds;
  }
  const group = await PermissionGroup.findByIdAndUpdate(id, update, { new: true });
  if (!group) throw new ApiError(404, 'Permission group not found');
  return group;
};
export const deleteGroup = async (id) => {
  // remove group from permissions and roles
  await Permission.updateMany({ group: id }, { $unset: { group: '' } });
  await Role.updateMany({ permissionGroups: id }, { $pull: { permissionGroups: id } });
  await PermissionGroup.findByIdAndDelete(id);
};

// Permissions
export const getPermissions = () => Permission.find().populate('group', 'name');
export const createPermission = (data) => Permission.create(data);
export const updatePermission = (id, data) => Permission.findByIdAndUpdate(id, data, { new: true });
export const deletePermission = async (id) => {
  await Role.updateMany({ permissions: id }, { $pull: { permissions: id } });
  await Permission.findByIdAndDelete(id);
};

// Role-Permission Group assignments
export const assignGroupToRole = (roleId, groupId) =>
  Role.findByIdAndUpdate(roleId, { $addToSet: { permissionGroups: groupId } }, { new: true });
export const removeGroupFromRole = (roleId, groupId) =>
  Role.findByIdAndUpdate(roleId, { $pull: { permissionGroups: groupId } }, { new: true });

import Permission from '../models/Permission.model.js';
import PermissionGroup from '../models/PermissionGroup.model.js';
import Role from '../models/Role.model.js';
import { ApiError } from '../utils/ApiError.util.js';

// Groups
export const getGroups = () => PermissionGroup.find();
export const createGroup = (name) => PermissionGroup.create({ name });
export const updateGroup = (id, name) => PermissionGroup.findByIdAndUpdate(id, { name }, { new: true });
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

import { getAuthorization } from '../services/Auth.service.js';
import User from '../models/User.model.js';
import * as accountService from '../services/Account.service.js';
import * as adminService from '../services/Admin.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { ApiError } from '../utils/ApiError.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await accountService.getProfile(req.user.id);
  new ApiResponse(200, profile, 'Profile retrieved').send(res);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await accountService.updateProfile(req.user.id, req.body);
  new ApiResponse(200, profile, 'Profile updated').send(res);
});

export const getPermissions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('role').lean();
  if (!user) throw new ApiError(404, 'User not found');

  const { permissions } = await getAuthorization(user);
  new ApiResponse(200, permissions, 'Permissions fetched').send(res);
});
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await accountService.changePassword(req.user.id, currentPassword, newPassword);
  new ApiResponse(200, null, 'Password changed successfully').send(res);
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image uploaded');
  const imagePath = `/uploads/products/${req.file.filename}`;
  await accountService.updateAvatar(req.user.id, imagePath);
  new ApiResponse(200, { avatar: imagePath }, 'Avatar updated').send(res);
});
export const activateUser = asyncHandler(async (req, res) => {
  const user = await adminService.activateUser(req.params.id, req.user.id);
  new ApiResponse(200, user, 'User activated').send(res);
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await adminService.deactivateUser(req.params.id, req.user.id);
  new ApiResponse(200, user, 'User deactivated').send(res);
});
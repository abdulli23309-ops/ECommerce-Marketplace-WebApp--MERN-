import * as accountService from '../services/Account.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
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
  const data = await accountService.getMyPermissions(req.user.id);
  new ApiResponse(200, data, 'Permissions retrieved').send(res);
});

import { ApiError } from '../utils/ApiError.util.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';
import * as authService from '../services/Auth.service.js';

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  new ApiResponse(201, result, 'Registration successful').send(res);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  new ApiResponse(200, result, 'Login successful').send(res);
});

const refreshToken = asyncHandler(async (req, res) => {
  if (!req.body.refreshToken) throw new ApiError(400, 'Refresh token is required');
  const result = await authService.refreshAccessToken(req.body.refreshToken);
  new ApiResponse(200, result, 'Token refreshed').send(res);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  new ApiResponse(200, null, 'Logged out successfully').send(res);
});

export { login, logout, refreshToken, register };

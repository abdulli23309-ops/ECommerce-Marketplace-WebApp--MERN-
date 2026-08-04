import * as adminService from '../services/Admin.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStats();
  new ApiResponse(200, stats, 'Admin stats retrieved').send(res);
});
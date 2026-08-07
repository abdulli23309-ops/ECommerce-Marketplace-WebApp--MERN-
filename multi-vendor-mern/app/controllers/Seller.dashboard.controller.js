import * as sellerDashboardService from '../services/Seller.dashboard.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const stats = await sellerDashboardService.getDashboard(req.user.id);
  new ApiResponse(200, stats, 'Seller dashboard').send(res);
});

export const getOrders = asyncHandler(async (req, res) => {
  const data = await sellerDashboardService.getSellerOrders(req.user.id, req.query);
  new ApiResponse(200, data, 'Seller orders retrieved').send(res);
});

export const getReviews = asyncHandler(async (req, res) => {
  const data = await sellerDashboardService.getSellerReviews(req.user.id, req.query);
  new ApiResponse(200, data, 'Seller reviews retrieved').send(res);
});
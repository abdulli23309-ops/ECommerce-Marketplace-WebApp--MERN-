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

// ---------- NEW ----------
export const getUnreadOrderCount = asyncHandler(async (req, res) => {
  const count = await sellerDashboardService.getUnreadCount(req.user.id);
  new ApiResponse(200, { count }, 'Unread count retrieved').send(res);
});

export const markOrdersAsRead = asyncHandler(async (req, res) => {
  await sellerDashboardService.markAllAsRead(req.user.id);
  new ApiResponse(200, null, 'Orders marked as read').send(res);
});
export const replyToReview = asyncHandler(async (req, res) => {
  const { replyText } = req.body;
  const updatedReview = await sellerDashboardService.replyToReview(
    req.user.id,
    req.params.reviewId,
    replyText
  );
  new ApiResponse(200, updatedReview, 'Reply saved').send(res);
});
import * as reviewService from '../services/Review.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body);
  new ApiResponse(201, review, 'Review created').send(res);
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getProductReviews(req.params.productId);
  new ApiResponse(200, reviews, 'Product reviews retrieved').send(res);
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getMyReviews(req.user.id);
  new ApiResponse(200, reviews, 'My reviews retrieved').send(res);
});
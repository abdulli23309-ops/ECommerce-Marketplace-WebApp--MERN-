import * as reviewService from '../services/Review.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body);
  new ApiResponse(201, review, 'Review created').send(res);
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const data = await reviewService.getProductReviews(req.params.productId, req.query);
  new ApiResponse(200, data, 'Product reviews retrieved').send(res);
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const data = await reviewService.getMyReviews(req.user.id, req.query);
  new ApiResponse(200, data, 'My reviews retrieved').send(res);
});

export const getReviewById = asyncHandler(async (req, res) => {
  const review = await reviewService.getReviewById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  new ApiResponse(200, review, 'Review retrieved').send(res);
});

export const uploadReviewImage = asyncHandler(async (req, res) => {
  const imagePaths = (req.files || []).map(file => `/uploads/products/${file.filename}`);
  if (imagePaths.length === 0) throw new ApiError(400, 'No image uploaded');
  new ApiResponse(200, { url: imagePaths[0] }, 'Image uploaded').send(res);
});
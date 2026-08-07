import * as reviewRepo from '../repositories/Review.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createReview = async (customerId, data) => {
  const { productId, sellerOrderId, rating, comment, images } = data;
  const sellerOrder = await orderRepo.findSellerOrderById(sellerOrderId);
  if (!sellerOrder) throw new ApiError(404, 'Seller order not found');
  const parentOrder = await orderRepo.findById(sellerOrder.parentOrder, customerId);
  if (!parentOrder) throw new ApiError(404, 'Order not found or not yours');
  if (sellerOrder.status !== 'Delivered') throw new ApiError(400, 'You can only review delivered items');
  const itemExists = sellerOrder.items.some((item) => item.product.toString() === productId);
  if (!itemExists) throw new ApiError(400, 'Product not found in this order');
  const existing = await reviewRepo.checkExisting(customerId, productId, sellerOrderId);
  if (existing) throw new ApiError(409, 'You have already reviewed this item');
  return reviewRepo.create({ customer: customerId, product: productId, sellerOrder: sellerOrderId, rating, comment, images });
};

export const getProductReviews = (productId, queryParams) =>
  reviewRepo.findByProduct(productId, queryParams);

export const getReviewById = (reviewId) => reviewRepo.findById(reviewId);

export const getMyReviews = (customerId, queryParams) =>
  reviewRepo.findByCustomer(customerId, queryParams);
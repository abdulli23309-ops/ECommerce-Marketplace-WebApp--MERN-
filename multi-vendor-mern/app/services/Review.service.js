import * as reviewRepo from '../repositories/Review.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import * as productRepo from '../repositories/Product.repository.js'; // if you have a product repo
import Store from '../models/Store.model.js';
import * as ratingModerationService from './RatingModeration.service.js';
import SellerProfile from '../models/SellerProfile.model.js';
import { ApiError } from '../utils/ApiError.util.js';
import { getRatingStats } from '../repositories/Product.repository.js';
import { createNotification } from './Notification.service.js';

/**
 * Create a new review for a product, then check if the product's average rating
 * drops below 2.0 and notify the seller if so.
 */
export const createReview = async (customerId, data) => {
  const { productId, sellerOrderId, rating, comment, images } = data;

  // Validate the seller order
  const sellerOrder = await orderRepo.findSellerOrderById(sellerOrderId);
  if (!sellerOrder) {
    throw new ApiError(404, 'Seller order not found');
  }

  // Ensure the parent order belongs to this customer
  const parentOrder = await orderRepo.findById(sellerOrder.parentOrder, customerId);
  if (!parentOrder) {
    throw new ApiError(404, 'Order not found or not yours');
  }

  if (sellerOrder.status !== 'Delivered') {
    throw new ApiError(400, 'You can only review delivered items');
  }

  const itemExists = sellerOrder.items.some(
    (item) => item.product.toString() === productId
  );
  if (!itemExists) {
    throw new ApiError(400, 'Product not found in this order');
  }

  // Prevent duplicate reviews
  const existing = await reviewRepo.checkExisting(customerId, productId, sellerOrderId);
  if (existing) {
    throw new ApiError(409, 'You have already reviewed this item');
  }

  // Create the review
  const review = await reviewRepo.create({
    customer: customerId,
    product: productId,
    sellerOrder: sellerOrderId,
    rating,
    comment,
    images,
  });

  // ---------- Rating moderation recalculation ----------
  // Both recalculations aggregate the Review collection, so they MUST run after
  // the review document exists. Running them earlier aggregated a review set
  // that was missing this review, which left a product's first review persisting
  // averageRating 0 / lowRatingStatus false.
  await ratingModerationService.recalculateProductRating(productId);

  const product = await productRepo.findPublicById(productId);
  if (product?.store) {
    const storeInfo = await Store.findOne({ _id: product.store._id })
      .select('sellerProfile')
      .lean();
    if (storeInfo?.sellerProfile) {
      await ratingModerationService.recalculateSellerRating(storeInfo.sellerProfile);
    }
  }

  // ---------- Low rating warning logic ----------
  // Separate, lower notification threshold (2.0) than the moderation threshold.
  const stats = await getRatingStats(productId);
  if (stats.reviewCount >= 1 && stats.avgRating < 2) {
    if (product && product.store) {
      const store = await Store.findById(product.store._id).select('sellerProfile');
      if (store) {
        const profile = await SellerProfile.findById(store.sellerProfile).select('user');
        if (profile) {
          await createNotification(
            profile.user,
            'rating',
            'Low Product Rating Warning',
            `${product.name} has an average rating below 2.0.`,
            `/seller/reviews`,
            { productId: product._id.toString(), avgRating: stats.avgRating }
          );
        }
      }
    }
  }

  return review;
};

// ---------- Query functions ----------

export const getProductReviews = (productId, queryParams) =>
  reviewRepo.findByProduct(productId, queryParams);

export const getReviewById = (reviewId) => reviewRepo.findById(reviewId);

export const getMyReviews = (customerId, queryParams) =>
  reviewRepo.findByCustomer(customerId, queryParams);
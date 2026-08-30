import Review from '../models/Review.model.js';
import { sanitizePagination } from '../utils/pagination.js';

export const create = (data) => Review.create(data);

export const findByProduct = async (productId, { page = 1, pageSize = 10 } = {}) => {
  const { page: safePage, pageSize: limit } = sanitizePagination(page, pageSize, 10);
  const skip = (safePage - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ product: productId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: productId }),
  ]);

  const sanitizedReviews = reviews.map((rev) => {
    if (rev.isAnonymous) {
      return {
        ...rev,
        customer: { name: 'Anonymous Customer' },
      };
    }
    return rev;
  });

  return { items: sanitizedReviews, total, page: safePage, pageSize: limit, totalPages: Math.ceil(total / limit) };
};

export const findByCustomer = async (customerId, { page = 1, pageSize = 10 } = {}) => {
  const { page: safePage, pageSize: limit } = sanitizePagination(page, pageSize, 10);
  const skip = (safePage - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ customer: customerId })
      .populate('product', 'name images')   // ← include images
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ customer: customerId }),
  ]);

  return { items: reviews, total, page: safePage, pageSize: limit, totalPages: Math.ceil(total / limit) };
};

export const checkExisting = (customerId, productId, sellerOrderId) =>
  Review.findOne({ customer: customerId, product: productId, sellerOrder: sellerOrderId });

export const findById = async (reviewId, requesterId) => {
  const review = await Review.findById(reviewId)
    .populate('product', 'name images')   // ← include images
    .populate('customer', 'name')
    .lean();

  // Ownership / visibility rule (M-018):
  // Only the review's author may retrieve their own review via this
  // endpoint. Anonymous/public product reviews are still served through the
  // separate GET /reviews/product/:productId route, which is intentionally
  // public and unaffected by this check.
  if (review && requesterId && review.customer && review.customer._id.toString() !== requesterId.toString()) {
    return null;
  }

  return review;
};
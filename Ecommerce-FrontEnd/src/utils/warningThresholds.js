export const PRODUCT_LOW_RATING_THRESHOLD = 3.0;
export const SELLER_LOW_RATING_THRESHOLD = 2.5;
export const LOW_STOCK_THRESHOLD = 5;
export const MAX_WARNINGS = 3;

/**
 * Low-rating risk for a product.
 *
 * The backend persists `lowRatingStatus` (computed as
 * reviewCount > 0 && averageRating < PRODUCT_LOW_RATING_THRESHOLD), so that flag
 * is authoritative when present. The rating comparison is only a fallback for
 * payloads that carry a rating but no flag.
 */
export const isProductLowRating = (product = {}) => {
  // Authoritative: backend lowRatingStatus flag
  if (product.lowRatingStatus === true) return true;
  if (product.lowRatingStatus === false) return false;

  // Fallback: when the flag is missing, compute from rating
  const rating = Number(product.avgRating ?? product.averageRating ?? 0);
  return rating > 0 && rating < PRODUCT_LOW_RATING_THRESHOLD;
};

export const isProductLowStock = (product = {}) =>
  Number(product.stock) <= LOW_STOCK_THRESHOLD;

/**
 * Get the product's average rating.
 * Checks both field names used across different API responses.
 */
export const getProductRating = (product = {}) =>
  Number(product.averageRating ?? product.avgRating ?? 0);

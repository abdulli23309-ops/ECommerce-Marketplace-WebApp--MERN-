import * as ratingModerationRepo from '../repositories/RatingModeration.repository.js';
import { logAction } from './AdminAuditLog.service.js';
import { createNotification } from './Notification.service.js';
import { ApiError } from '../utils/ApiError.util.js';

export const PRODUCT_LOW_RATING_THRESHOLD = 3.0;
export const SELLER_LOW_RATING_THRESHOLD = 2.5;
export const LOW_STOCK_THRESHOLD = 5;
export const MAX_WARNINGS = 3;

// Spec D4: a warning cycle decays 7 days after the MOST RECENT warning. A new
// warning resets the 7-day window. The stored warningCount/history are preserved
// permanently; only the *effective* count (used for gating/display) decays.
export const WARNING_DECAY_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const roundForDisplay = (value) => Math.round(value * 10) / 10;

// Effective warning count: 0 once 7 days have elapsed since the most recent
// warning, otherwise the stored count. Works for both seller profiles
// (lastSellerWarningAt) and products (lastProductWarningAt).
export const getEffectiveWarningCount = (doc, now = new Date()) => {
  if (!doc) return 0;
  const base = doc.warningCount || 0;
  const lastWarnedAt = doc.lastSellerWarningAt || doc.lastProductWarningAt;
  if (!lastWarnedAt) return base;
  const ageMs = now.getTime() - new Date(lastWarnedAt).getTime();
  if (ageMs >= WARNING_DECAY_DAYS * DAY_MS) return 0;
  return base;
};


export const recalculateProductRating = async (productId) => {
  const product = await ratingModerationRepo.findProductById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const { avgRating, reviewCount } = await ratingModerationRepo.aggregateProductRating(productId);

  const lowRatingStatus =
    reviewCount > 0 && avgRating < PRODUCT_LOW_RATING_THRESHOLD;

  const moderationUpdate = {
    averageRating: roundForDisplay(avgRating),
    lowRatingStatus,
  };

  // Rating recovery: once the average returns to (or above) the acceptable
  // threshold, the active warning cycle is closed and warningCount resets to 0.
  // warningHistory is preserved permanently for audit — a later dip below the
  // threshold simply begins a fresh 0..MAX_WARNINGS cycle.
  if (reviewCount > 0 && avgRating >= PRODUCT_LOW_RATING_THRESHOLD) {
    moderationUpdate.warningCount = 0;
  }

  const updated = await ratingModerationRepo.updateProductModerationState(
    productId,
    moderationUpdate
  );

  return updated;
};

export const recalculateSellerRating = async (sellerProfileId) => {
  const sellerProfile = await ratingModerationRepo.findSellerProfileById(sellerProfileId);
  if (!sellerProfile) throw new ApiError(404, 'Seller profile not found');

  const store = await ratingModerationRepo.findStoreBySellerProfile(sellerProfileId);

  let avgRating = 0;
  let reviewCount = 0;

  if (store) {
    const products = await ratingModerationRepo.findProductsByStore(store._id);
    const productIds = products.map((product) => product._id);

    const stats = await ratingModerationRepo.aggregateSellerRating(productIds);
    avgRating = stats.avgRating;
    reviewCount = stats.reviewCount;
  }

  const lowRatingStatus =
    reviewCount > 0 && avgRating < SELLER_LOW_RATING_THRESHOLD;

  const moderationUpdate = {
    averageRating: roundForDisplay(avgRating),
    lowRatingStatus,
  };

  // Rating recovery: once the average returns to (or above) the acceptable
  // threshold, the active warning cycle is closed and warningCount resets to 0.
  // warningHistory is preserved permanently for audit — a later dip below the
  // threshold simply begins a fresh 0..MAX_WARNINGS cycle.
  if (reviewCount > 0 && avgRating >= SELLER_LOW_RATING_THRESHOLD) {
    moderationUpdate.warningCount = 0;
  }

  const updated = await ratingModerationRepo.updateSellerModerationState(
    sellerProfileId,
    moderationUpdate
  );

  return updated;
};

export const getSellerModerationStatus = async (sellerProfileId) => {
  await recalculateSellerRating(sellerProfileId);

  const sellerProfile = await ratingModerationRepo.findSellerProfileById(sellerProfileId);
  if (!sellerProfile) throw new ApiError(404, 'Seller profile not found');

  const effectiveWarningCount = getEffectiveWarningCount(sellerProfile);

  return {
    sellerProfileId: sellerProfile._id,
    averageRating: sellerProfile.averageRating,
    lowRatingStatus: sellerProfile.lowRatingStatus,
    warningCount: effectiveWarningCount,
    storedWarningCount: sellerProfile.warningCount,
    maxWarnings: MAX_WARNINGS,
    canWarn:
      sellerProfile.lowRatingStatus && effectiveWarningCount < MAX_WARNINGS,
    warningHistory: sellerProfile.warningHistory,
    lastSellerWarningAt: sellerProfile.lastSellerWarningAt,
  };
};

export const issueSellerWarning = async (sellerProfileId, adminId, reason) => {
  const sellerProfile = await ratingModerationRepo.findSellerProfileById(sellerProfileId);
  if (!sellerProfile) throw new ApiError(404, 'Seller profile not found');

  // Recalculate first so decision is based on current reviews.
  await recalculateSellerRating(sellerProfileId);

  const updatedProfile = await ratingModerationRepo.findSellerProfileById(sellerProfileId);

  if (!updatedProfile.lowRatingStatus) {
    throw new ApiError(400, 'Seller rating is not below the warning threshold');
  }

  // Spec D4: gate on the EFFECTIVE (decayed) count, not the stored count.
  if (getEffectiveWarningCount(updatedProfile) >= MAX_WARNINGS) {
    throw new ApiError(400, 'Warning limit reached for this seller');
  }

  const warningCount = updatedProfile.warningCount + 1;

  const updated = await ratingModerationRepo.updateSellerModerationState(sellerProfileId, {
    warningCount,
    lastSellerWarningAt: new Date(),
    $push: {
      warningHistory: {
        warnedBy: adminId,
        reason: reason || '',
        warnedAt: new Date(),
      },
    },
  });

  await logAction(
    adminId,
    'seller.rating.warn',
    'SellerProfile',
    sellerProfileId,
    { warningCount, reason: reason || '' }
  );

  if (updated.user) {
    await createNotification(
      updated.user,
      'seller',
      'Low Seller Rating Warning',
      `Your seller rating is below the expected threshold. Warning ${warningCount}/${MAX_WARNINGS}.`,
      '/seller/dashboard',
      { sellerProfileId: updated._id.toString(), warningCount }
    );
  }

  return updated;
};

export const getProductModerationStatus = async (productId) => {
  await recalculateProductRating(productId);

  const product = await ratingModerationRepo.findProductById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const effectiveWarningCount = getEffectiveWarningCount(product);

  return {
    productId: product._id,
    averageRating: product.averageRating,
    lowRatingStatus: product.lowRatingStatus,
    warningCount: effectiveWarningCount,
    storedWarningCount: product.warningCount,
    maxWarnings: MAX_WARNINGS,
    canWarn:
      product.lowRatingStatus && effectiveWarningCount < MAX_WARNINGS,
    warningHistory: product.warningHistory,
    lastProductWarningAt: product.lastProductWarningAt,
  };
};

export const issueProductWarning = async (productId, adminId, reason) => {
  const product = await ratingModerationRepo.findProductById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  // Recalculate first so decision is based on current reviews.
  await recalculateProductRating(productId);

  const updatedProduct = await ratingModerationRepo.findProductById(productId);

  if (!updatedProduct.lowRatingStatus) {
    throw new ApiError(400, 'Product rating is not below the warning threshold');
  }

  // Spec D4: gate on the EFFECTIVE (decayed) count, not the stored count.
  if (getEffectiveWarningCount(updatedProduct) >= MAX_WARNINGS) {
    throw new ApiError(400, 'Warning limit reached for this product');
  }

  const warningCount = updatedProduct.warningCount + 1;

  const updated = await ratingModerationRepo.updateProductModerationState(productId, {
    warningCount,
    lastProductWarningAt: new Date(),
    $push: {
      warningHistory: {
        warnedBy: adminId,
        reason: reason || '',
        warnedAt: new Date(),
      },
    },
  });

  await logAction(
    adminId,
    'product.rating.warn',
    'Product',
    productId,
    { warningCount, reason: reason || '' }
  );

  const storeInfo = await ratingModerationRepo.findSellerProfileByStoreId(updated.store);
  if (storeInfo?.sellerProfile) {
    const sellerProfile = await ratingModerationRepo.findSellerProfileById(storeInfo.sellerProfile);

    if (sellerProfile?.user) {
      await createNotification(
        sellerProfile.user,
        'seller',
        'Low Product Rating Warning',
        `${updated.name} has a low average rating. Warning ${warningCount}/${MAX_WARNINGS}.`,
        '/seller/products',
        { productId: updated._id.toString(), warningCount }
      );
    }
  }

  return updated;
};
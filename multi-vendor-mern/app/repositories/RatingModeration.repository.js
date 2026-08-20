import mongoose from 'mongoose';
import SellerProfile from '../models/SellerProfile.model.js';
import Product from '../models/Product.model.js';
import Store from '../models/Store.model.js';
import Review from '../models/Review.model.js';

export const findSellerProfileById = (sellerProfileId) =>
  SellerProfile.findById(sellerProfileId);

export const findProductById = (productId) =>
  Product.findById(productId);

export const findProductsByStore = (storeId) =>
  Product.find({ store: storeId, isDeleted: false }).select('_id').lean();

export const findStoreBySellerProfile = (sellerProfileId) =>
  Store.findOne({ sellerProfile: sellerProfileId }).select('_id sellerProfile');

export const findSellerProfileByStoreId = (storeId) =>
  Store.findOne({ _id: storeId }).select('sellerProfile').lean();

export const aggregateProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (!result.length) {
    return { avgRating: 0, reviewCount: 0 };
  }

  return {
    avgRating: result[0].avgRating,
    reviewCount: result[0].reviewCount,
  };
};

export const aggregateSellerRating = async (productIds) => {
  if (!productIds.length) {
    return { avgRating: 0, reviewCount: 0 };
  }

  const result = await Review.aggregate([
    { $match: { product: { $in: productIds } } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (!result.length) {
    return { avgRating: 0, reviewCount: 0 };
  }

  return {
    avgRating: result[0].avgRating,
    reviewCount: result[0].reviewCount,
  };
};

export const updateProductModerationState = (productId, data) =>
  Product.findByIdAndUpdate(productId, data, { new: true, runValidators: true });

export const updateSellerModerationState = (sellerProfileId, data) =>
  SellerProfile.findByIdAndUpdate(sellerProfileId, data, {
    new: true,
    runValidators: true,
  });
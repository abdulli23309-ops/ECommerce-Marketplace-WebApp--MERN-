import mongoose from 'mongoose';
import Product from '../models/Product.model.js';
import Review from '../models/Review.model.js';
import * as storeRepo from './Store.repository.js';
import { sanitizePagination } from '../utils/pagination.js';
import { ApiError } from '../utils/ApiError.util.js';

export const create = (data) => Product.create(data);

export const findById = (id) => Product.findOne({ _id: id, isDeleted: false });
export const findByIdWithRating = async (productId, storeId) => {
  const product = await Product.findOne({ _id: productId, store: storeId, isDeleted: false })
    .populate('category', 'name')
    .populate('subCategory', 'name')
    .populate('brand', 'name')
    .lean();

  if (!product) return null;

  const stats = await getRatingStats(productId);
  return {
    ...product,
    avgRating: stats.avgRating,
    reviewCount: stats.reviewCount,
  };
};

export const findByStore = async (storeId, options = {}) => {
  const { page = 1, pageSize = 12, ...query } = options;
  const filter = { ...query, store: storeId, isDeleted: false };
  const { page: safePage, pageSize: limit } = sanitizePagination(page, pageSize, 12);
  const skip = (safePage - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('brand', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    page: safePage,
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

// Lightweight store-scoped id list (used by the moderation timeline to map
// a seller's products to their audit events such as product.republish).
export const findIdsByStore = (storeId) =>
  Product.find({ store: storeId, isDeleted: false }).select('_id').lean();

export const updateById = (id, data) =>
  Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export const softDelete = (id) =>
  Product.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

// Bulk transition a store's live (Approved) products to a new status within a
// transaction. Used when suspending a seller: their Approved products become
// 'Suspended' so they stay inactive after reinstatement until explicitly
// republished (frozen D8), and the explicit republish lifecycle stays meaningful.
export const bulkSetStatusByStore = async (storeId, status, session) =>
  Product.updateMany(
    { store: storeId, isDeleted: false, status: 'Approved' },
    { $set: { status } },
    session ? { session } : {}
  );

export const findPublic = async (query = {}) => {
  const allowedStoreIds = await storeRepo.getPubliclyActiveStoreIds();
  return Product.find({
    ...query,
    isDeleted: false,
    status: 'Approved',
    store: { $in: allowedStoreIds },
  });
};

export const findPublicById = async (id) => {
  const allowedStoreIds = await storeRepo.getPubliclyActiveStoreIds();
  return Product.findOne({
    _id: id,
    isDeleted: false,
    status: 'Approved',
    store: { $in: allowedStoreIds },
  })
    .populate('store', 'name description logo')
    .lean();
};

export const findPublicWithFilters = async (filters = {}) => {
  const {
    search,
    categoryId,
    subCategoryId,
    brandId,
    minPrice,
    maxPrice,
    sortBy,
    page = 1,
    pageSize = 12,
    store,
  } = filters;

  const query = {
    isDeleted: false,
    status: 'Approved',
  };

  const allowedStoreIds = await storeRepo.getPubliclyActiveStoreIds();
  if (store) {
    // Explicit store filter must also respect public seller availability.
    // If the requested store is not in the publicly active list, the query will match nothing.
    query.store = { $in: allowedStoreIds.filter(id => id.toString() === store) };
  } else {
    query.store = { $in: allowedStoreIds };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  if (categoryId) query.category = categoryId;
  if (subCategoryId) query.subCategory = subCategoryId;
  if (brandId) query.brand = brandId;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let sortOption = { createdAt: -1 };
  if (sortBy === 'price_asc') sortOption = { price: 1 };
  else if (sortBy === 'price_desc') sortOption = { price: -1 };
  else if (sortBy === 'newest') sortOption = { createdAt: -1 };

  // M-019: page/pageSize are validated and bounded (public catalog surface).
  const { page: safePage, pageSize: limit } = sanitizePagination(page, pageSize, 12);
  const skip = (safePage - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('brand', 'name')
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    items: products,
    page: safePage,
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};


export const deductStock = async (productId, quantity, session) => {
  const updatedProduct = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true, session }
  );
  if (!updatedProduct) {
    throw new ApiError(400, `Insufficient stock for product ${productId}`);
  }
  return updatedProduct;
};

export const findAllAdmin = async (filters = {}) => {
  const { page = 1, pageSize = 50, status } = filters;
  const query = { isDeleted: false };
  if (status) query.status = status;
  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('store', 'name logo description')
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('brand', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return { products, page: Number(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) };
};

export const findByIdAdmin = (productId) =>
  Product.findOne({ _id: productId, isDeleted: false })
    .populate('store', 'name logo description')
    .populate('category', 'name')
    .populate('subCategory', 'name')
    .populate('brand', 'name')
    .lean();

export const getRatingStats = async (productId) => {
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
  if (result.length === 0) return { avgRating: 0, reviewCount: 0 };
  return {
    avgRating: Math.round(result[0].avgRating * 10) / 10,
    reviewCount: result[0].reviewCount,
  };
};

export const findSuggestions = async (q, limit = 8) => {
  if (!q || q.trim().length < 2) return [];
  const allowedStoreIds = await storeRepo.getPubliclyActiveStoreIds();
  return Product.find({
    isDeleted: false,
    status: 'Approved',
    store: { $in: allowedStoreIds },
    name: { $regex: `^${q.trim()}`, $options: 'i' },
  })
    .select('_id name')
    .limit(limit)
    .lean();
};

// New method for global admin product statistics
export const getAdminProductStats = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const [
    pendingApproval,
    highRiskFlags,
    approvedToday,
    totalProducts,
    rejectedCount,
  ] = await Promise.all([
    Product.countDocuments({ isDeleted: false, status: 'PendingApproval' }),
    Product.countDocuments({
      isDeleted: false,
      status: { $in: ['Suspended', 'Rejected'] },
    }),
    Product.countDocuments({
      isDeleted: false,
      status: 'Approved',
      approvedAt: { $gte: startOfToday, $lt: startOfTomorrow },
    }),
    Product.countDocuments({ isDeleted: false }),
    Product.countDocuments({ isDeleted: false, status: 'Rejected' }),
  ]);

  const rejectionRate = totalProducts
    ? ((rejectedCount / totalProducts) * 100).toFixed(1) + '%'
    : '0%';

  return {
    pendingApproval,
    highRiskFlags,
    approvedToday,
    rejectionRate,
    totalProducts,
  };
};
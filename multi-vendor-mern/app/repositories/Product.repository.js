import mongoose from 'mongoose';
import Product from '../models/Product.model.js';
import Review from '../models/Review.model.js';
import * as storeRepo from './Store.repository.js';

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
  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

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
    page: Number(page),
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

export const updateById = (id, data) =>
  Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export const softDelete = (id) =>
  Product.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

export const findPublic = (query = {}) =>
  Product.find({ ...query, isDeleted: false, status: 'Approved' });

export const findPublicById = (id) =>
  Product.findOne({ _id: id, isDeleted: false, status: 'Approved' })
    .populate('store', 'name description logo')
    .lean();

export const findPublicWithFilters = async (filters = {}) => {
  const allowedStoreIds = await storeRepo.getActiveStoreIdsForApprovedSellers();
  const {
    search,
    categoryId,
    subCategoryId,
    brandId,
    minPrice,
    maxPrice,
    sortBy,
    page = 1,
    pageSize = 12
  } = filters;

  const query = {
    isDeleted: false,
    status: 'Approved',
    store: { $in: allowedStoreIds }
  };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  if (categoryId)   query.category = categoryId;
  if (subCategoryId) query.subCategory = subCategoryId;
  if (brandId)       query.brand = brandId;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let sortOption = { createdAt: -1 };
  if (sortBy === 'price_asc')    sortOption = { price: 1 };
  else if (sortBy === 'price_desc') sortOption = { price: -1 };
  else if (sortBy === 'newest')    sortOption = { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

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
    products,
    page: Number(page),
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

export const deductStock = async (productId, quantity, session) => {
  const product = await Product.findById(productId).session(session);
  if (!product) throw new Error('Product not found');
  product.stock -= quantity;
  return product.save({ session });
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
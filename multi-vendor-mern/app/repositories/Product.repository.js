import Product from '../models/Product.model.js';
import * as storeRepo from './Store.repository.js';

export const create = (data) => Product.create(data);

export const findById = (id) => Product.findOne({ _id: id, isDeleted: false });

export const findByStore = (storeId, query = {}) =>
  Product.find({ ...query, store: storeId, isDeleted: false });

export const updateById = (id, data) =>
  Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export const softDelete = (id) =>
  Product.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

export const findPublic = (query = {}) =>
  Product.find({ ...query, isDeleted: false, isActive: true });

export const findPublicById = (id) =>
  Product.findOne({ _id: id, isDeleted: false, isActive: true });

export const findPublicWithFilters = async (filters = {}) => {
  // get stores belonging to approved sellers and active
  const allowedStoreIds = await storeRepo.getActiveStoreIdsForApprovedSellers();

  const {
    search,
    category,
    subCategory,
    brand,
    minPrice,
    maxPrice,
    sort,
    page = 1,
    pageSize = 12,
  } = filters;

  const query = {
    isDeleted: false,
    isActive: true,
    store: { $in: allowedStoreIds },
  };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) query.category = category;
  if (subCategory) query.subCategory = subCategory;
  if (brand) query.brand = brand;

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let sortOption = {};
  if (sort === 'price') sortOption = { price: 1 };
  else if (sort === '-price') sortOption = { price: -1 };
  else if (sort === 'newest') sortOption = { createdAt: -1 };
  else sortOption = { createdAt: -1 };

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
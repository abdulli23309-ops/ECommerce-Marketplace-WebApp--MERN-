import Product from '../models/Product.model.js';
import Store from '../models/Store.model.js';
import Category from '../models/Category.model.js';
import SubCategory from '../models/SubCategory.model.js';
import Brand from '../models/Brand.model.js';
import { ApiError } from '../utils/ApiError.util.js';

export const getAllProducts = async (filters = {}) => {
  const { page = 1, pageSize = 50, status } = filters;
  const query = { isDeleted: false };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  // 1. Get plain product data (no populate)
  const [productDocs, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  // 2. Extract all referenced IDs
  const storeIds = [...new Set(productDocs.map(p => p.store?.toString()))].filter(Boolean);
  const categoryIds = [...new Set(productDocs.map(p => p.category?.toString()))].filter(Boolean);
  const subCategoryIds = [...new Set(productDocs.map(p => p.subCategory?.toString()))].filter(Boolean);
  const brandIds = [...new Set(productDocs.map(p => p.brand?.toString()))].filter(Boolean);

  // 3. Fetch referenced documents in parallel
  const [stores, categories, subCategories, brands] = await Promise.all([
    Store.find({ _id: { $in: storeIds } }).lean(),
    Category.find({ _id: { $in: categoryIds } }).lean(),
    SubCategory.find({ _id: { $in: subCategoryIds } }).lean(),
    Brand.find({ _id: { $in: brandIds } }).lean(),
  ]);

  // Convert to maps for quick lookup
  const storeMap = Object.fromEntries(stores.map(s => [s._id.toString(), s]));
  const categoryMap = Object.fromEntries(categories.map(c => [c._id.toString(), c]));
  const subCategoryMap = Object.fromEntries(subCategories.map(s => [s._id.toString(), s]));
  const brandMap = Object.fromEntries(brands.map(b => [b._id.toString(), b]));

  // 4. Merge referenced data into each product
  const products = productDocs.map(product => ({
    ...product,
    store: product.store ? storeMap[product.store.toString()] : null,
    category: product.category ? categoryMap[product.category.toString()] : null,
    subCategory: product.subCategory ? subCategoryMap[product.subCategory.toString()] : null,
    brand: product.brand ? brandMap[product.brand.toString()] : null,
  }));

  return { products, page: Number(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) };
};

export const getProductById = async (productId) => {
  const product = await Product.findOne({ _id: productId, isDeleted: false }).lean();
  if (!product) throw new ApiError(404, 'Product not found');

  const [store, category, subCategory, brand] = await Promise.all([
    product.store ? Store.findById(product.store).lean() : null,
    product.category ? Category.findById(product.category).lean() : null,
    product.subCategory ? SubCategory.findById(product.subCategory).lean() : null,
    product.brand ? Brand.findById(product.brand).lean() : null,
  ]);

  return { ...product, store, category, subCategory, brand };
};

export const updateStatus = async (productId, status, reason, note) => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  product.status = status;
  if (reason || note) console.log(`Admin note for ${productId}: reason=${reason}, note=${note}`);
  return product.save();
};
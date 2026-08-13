import * as productRepo from '../repositories/Product.repository.js';
import * as storeRepo from '../repositories/Store.repository.js';
import * as categoryRepo from '../repositories/Category.repository.js';
import * as subCategoryRepo from '../repositories/SubCategory.repository.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

const resolveStore = async (userId) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  if (profile.status !== 'Approved') throw new ApiError(403, 'Your seller account is not approved');
  const store = await storeRepo.findBySeller(profile._id);
  if (!store) throw new ApiError(404, 'Store not found');
  return store;
};

export const createProduct = async (userId, data) => {
  const store = await resolveStore(userId);

  // Validate category and subcategory are active and not deleted
  const category = await categoryRepo.findById(data.category);
  if (!category || category.isDeleted || !category.isActive) {
    throw new ApiError(400, 'Category is not available');
  }
  const subCategory = await subCategoryRepo.findById(data.subCategory);
  if (!subCategory || subCategory.isDeleted || !subCategory.isActive) {
    throw new ApiError(400, 'Subcategory is not available');
  }

  return productRepo.create({ ...data, store: store._id });
};
export const getMyProductById = async (userId, productId) => {
  const store = await resolveStore(userId);
  const product = await productRepo.findByIdWithRating(productId, store._id);
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};
export const getPublicProducts = (filters) => {
  // Ensure store is included if present
  return productRepo.findPublicWithFilters(filters);
};

export const getMyProducts = async (userId, queryParams = {}) => {
  const store = await resolveStore(userId);
  const { page, pageSize, ...otherFilters } = queryParams;
  const result = await productRepo.findByStore(store._id, { page, pageSize, ...otherFilters });

  // Attach rating stats to each product
  const productsWithRating = await Promise.all(
    result.products.map(async (product) => {
      const stats = await productRepo.getRatingStats(product._id);
      return {
        ...product,
        avgRating: stats.avgRating,
        reviewCount: stats.reviewCount,
      };
    })
  );

  return {
    ...result,
    products: productsWithRating,
  };
};

export const updateMyProduct = async (userId, productId, data) => {
  const store = await resolveStore(userId);
  const product = await productRepo.findById(productId);
  if (!product || product.store.toString() !== store._id.toString()) {
    throw new ApiError(404, 'Product not found');
  }

  // If seller attempts to change category/subcategory, validate they are active
  if (data.category) {
    const category = await categoryRepo.findById(data.category);
    if (!category || category.isDeleted || !category.isActive) {
      throw new ApiError(400, 'Category is not available');
    }
  }
  if (data.subCategory) {
    const subCategory = await subCategoryRepo.findById(data.subCategory);
    if (!subCategory || subCategory.isDeleted || !subCategory.isActive) {
      throw new ApiError(400, 'Subcategory is not available');
    }
  }

  // Prevent seller from overriding the status directly
  delete data.status;

  // Auto‑transition Rejected/Suspended → PendingApproval
  if (['Rejected', 'Suspended'].includes(product.status)) {
    data.status = 'PendingApproval';
    data.rejectionReason = null;
    data.internalNote = null;
  }

  return productRepo.updateById(productId, data);
};

export const deleteMyProduct = async (userId, productId) => {
  const store = await resolveStore(userId);
  const product = await productRepo.findById(productId);
  if (!product || product.store.toString() !== store._id.toString()) {
    throw new ApiError(404, 'Product not found');
  }
  return productRepo.softDelete(productId);
};

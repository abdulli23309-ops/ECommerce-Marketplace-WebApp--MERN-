import * as productRepo from '../repositories/Product.repository.js';
import * as storeRepo from '../repositories/Store.repository.js';
import * as categoryRepo from '../repositories/Category.repository.js';
import * as subCategoryRepo from '../repositories/SubCategory.repository.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

/**
 * Helper – returns profile and store (both may be null)
 */
const getStoreId = async (userId) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  const store = profile
    ? await storeRepo.findBySeller(profile._id)
    : null;
  return { profile, store };
};

/**
 * Resolve store – throws if profile missing, not approved, or store missing.
 * Used for write operations and single product retrieval.
 */
const resolveStore = async (userId) => {
  const { profile, store } = await getStoreId(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  if (profile.status !== 'Approved') throw new ApiError(403, 'Your seller account is not approved');
  if (!store) throw new ApiError(404, 'Store not found');
  return store;
};

// ----------------------------------------------------------------------
// Public / customer endpoints (unchanged)
// ----------------------------------------------------------------------
export const getPublicProducts = (filters) => {
  return productRepo.findPublicWithFilters(filters);
};

// ----------------------------------------------------------------------
// Seller endpoints – null‑safe listing
// ----------------------------------------------------------------------

/**
 * Get seller's own products – returns empty paginated result if no store.
 */
export const getMyProducts = async (userId, queryParams = {}) => {
  const { store } = await getStoreId(userId);

  if (!store) {
    // No store → empty result
    const page = Number(queryParams.page || 1);
    const pageSize = Number(queryParams.pageSize || 12);
    return {
      products: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

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

/**
 * Create a new product – requires an approved store.
 */
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

/**
 * Get a single product by ID – requires store ownership.
 */
export const getMyProductById = async (userId, productId) => {
  const store = await resolveStore(userId);
  const product = await productRepo.findByIdWithRating(productId, store._id);
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

/**
 * Update a product – requires store ownership and active category/subcategory if changed.
 */
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

/**
 * Soft‑delete a product – requires store ownership.
 */
export const deleteMyProduct = async (userId, productId) => {
  const store = await resolveStore(userId);
  const product = await productRepo.findById(productId);
  if (!product || product.store.toString() !== store._id.toString()) {
    throw new ApiError(404, 'Product not found');
  }
  return productRepo.softDelete(productId);
};
import * as productRepo from '../repositories/Product.repository.js';
import * as storeRepo from '../repositories/Store.repository.js';
import * as categoryRepo from '../repositories/Category.repository.js';
import * as subCategoryRepo from '../repositories/SubCategory.repository.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import { logAction } from './AdminAuditLog.service.js';
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
 * Resolve store – throws if profile missing, not approved, not approved (suspended),
 * or store missing. Used for write operations and single product retrieval.
 * NOTE: a Suspended seller may still fulfil existing obligations (shipments,
 * returns) — those paths intentionally do NOT route through resolveStore.
 */
const resolveStore = async (userId) => {
  const { profile, store } = await getStoreId(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  if (profile.status === 'Suspended') {
    throw new ApiError(403, 'Your seller account is suspended and cannot create new marketplace activity');
  }
  if (profile.status !== 'Approved') throw new ApiError(403, 'Your seller account is not approved');
  if (!store) throw new ApiError(404, 'Store not found');
  return store;
};

// ----------------------------------------------------------------------
// Public / customer endpoints
// ----------------------------------------------------------------------
// M-028: this duplicated getPublicProducts wrapper was removed — the live
// public catalog path is Product.public.service.getPublicProducts, consumed
// by Product.public.controller via /api/v1/products.
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
 * M-011: this is a READ path and intentionally does NOT go through
 * resolveStore, so a suspended seller can still view their own product
 * details (consistent with the allowed product-list read). Ownership is
 * enforced by scoping the lookup to the seller's own store, so cross-seller
 * access is impossible. Write paths keep the resolveStore suspension gate.
 */
export const getMyProductById = async (userId, productId) => {
  const { store } = await getStoreId(userId);
  if (!store) throw new ApiError(404, 'Store not found');
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

  // Auto‑transition Rejected → PendingApproval on a normal edit (re-approval flow).
  // Suspended products are EXCLUDED here: a suspended seller cannot silently
  // republish via a regular edit — they must use the explicit republish action,
  // which itself is only reachable after reinstatement (resolveStore blocks
  // suspended sellers). This neutralizes the auto-transition bypass.
  if (product.status === 'Rejected') {
    data.status = 'PendingApproval';
    data.rejectionReason = null;
    data.internalNote = null;
  }

  return productRepo.updateById(productId, data);
};

/**
 * Explicit republish of a Suspended product. Only reachable after reinstatement
 * (resolveStore blocks suspended sellers). Moves the product back to
 * PendingApproval for admin review (Spec D5 — products do NOT auto-return).
 * Resets the product warning count to 0 (D5) while preserving warning history.
 */
export const republishMyProduct = async (userId, productId) => {
  const store = await resolveStore(userId);
  const product = await productRepo.findById(productId);
  if (!product || product.store.toString() !== store._id.toString()) {
    throw new ApiError(404, 'Product not found');
  }
  if (product.status !== 'Suspended') {
    throw new ApiError(409, 'Only suspended products can be republished');
  }
  const republished = await productRepo.updateById(productId, {
    status: 'PendingApproval',
    rejectionReason: null,
    internalNote: null,
    warningCount: 0,
  });

  // Step 9 audit: a product republish has no dedicated domain record in the
  // moderation timeline, so it is recorded in the immutable AdminAuditLog and
  // surfaced in the seller timeline via the audit source.
  await logAction(userId, 'product.republish', 'Product', productId, {
    store: store._id,
  });

  return republished;
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
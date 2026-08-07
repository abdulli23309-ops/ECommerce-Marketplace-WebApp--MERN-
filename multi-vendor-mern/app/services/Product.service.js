import * as productRepo from '../repositories/Product.repository.js';
import * as storeRepo from '../repositories/Store.repository.js';
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
  return productRepo.create({ ...data, store: store._id });
};

export const getMyProducts = async (userId, queryParams = {}) => {
  const store = await resolveStore(userId);
  const { page, pageSize, ...otherFilters } = queryParams;
  return productRepo.findByStore(store._id, { page, pageSize, ...otherFilters });
};

export const updateMyProduct = async (userId, productId, data) => {
  const store = await resolveStore(userId);
  const product = await productRepo.findById(productId);
  if (!product || product.store.toString() !== store._id.toString()) {
    throw new ApiError(404, 'Product not found');
  }
  delete data.status;
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
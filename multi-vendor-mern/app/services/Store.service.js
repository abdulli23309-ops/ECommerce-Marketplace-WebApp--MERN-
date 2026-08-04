import * as storeRepo from '../repositories/Store.repository.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

const resolveSellerProfile = async (userId) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  if (!profile.isApproved) throw new ApiError(403, 'Your seller account is not yet approved');
  return profile;
};

const ALLOWED_UPDATE_FIELDS = ['name', 'description', 'logo', 'city'];

export const createStore = async (userId, data, userPermissions) => {
  const profile = await resolveSellerProfile(userId);
  const existing = await storeRepo.findBySeller(profile._id);
  if (existing && !userPermissions.includes('Store.CreateMultiple')) {
    throw new ApiError(403, 'You already own a store');
  }
  return storeRepo.create({ ...data, sellerProfile: profile._id });
};

export const getMyStores = async (userId) => {
  const profile = await resolveSellerProfile(userId);
  return storeRepo.findAllBySeller(profile._id);
};

export const updateStore = async (userId, storeId, data) => {
  const profile = await resolveSellerProfile(userId);
  const store = await storeRepo.findById(storeId);
  if (!store || store.sellerProfile.toString() !== profile._id.toString()) {
    throw new ApiError(404, 'Store not found');
  }
  const safeUpdate = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (data[key] !== undefined) safeUpdate[key] = data[key];
  }
  return storeRepo.updateById(storeId, safeUpdate);
};

export const deleteStore = async (userId, storeId) => {
  const profile = await resolveSellerProfile(userId);
  const store = await storeRepo.findById(storeId);
  if (!store || store.sellerProfile.toString() !== profile._id.toString()) {
    throw new ApiError(404, 'Store not found');
  }
  return storeRepo.updateById(storeId, { isActive: false }); // soft deactivation
};
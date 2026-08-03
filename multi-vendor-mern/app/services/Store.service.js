import * as storeRepo from '../repositories/Store.repository.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

const createStore = async (userId, data, userPermissions) => {
  let profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) {
    profile = await sellerProfileRepo.create({ user: userId });
  }

  if (!profile.isApproved) {
    throw new ApiError(403, 'Your seller account is not yet approved');
  }

  const existing = await storeRepo.findBySeller(profile._id);
  if (existing && !userPermissions.includes('Store.CreateMultiple')) {
    throw new ApiError(403, 'You already own a store');
  }

  return storeRepo.create({ ...data, sellerProfile: profile._id });
};

const getMyStore = async (userId) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) return null;
  return storeRepo.findBySeller(profile._id);
};

const ALLOWED_UPDATE_FIELDS = ['name', 'description', 'logo'];

const updateMyStore = async (userId, data) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  if (!profile.isApproved) throw new ApiError(403, 'Your seller account is not yet approved');

  const store = await storeRepo.findBySeller(profile._id);
  if (!store) throw new ApiError(404, 'Store not found');

  // Whitelist: pick only allowed fields
  const safeUpdate = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (data[key] !== undefined) {
      safeUpdate[key] = data[key];
    }
  }

  return storeRepo.updateById(store._id, safeUpdate);
};

export { createStore, getMyStore, updateMyStore };

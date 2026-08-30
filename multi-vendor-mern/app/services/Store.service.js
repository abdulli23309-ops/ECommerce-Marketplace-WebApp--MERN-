import * as storeRepo from '../repositories/Store.repository.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

const ALLOWED_UPDATE_FIELDS = ['name', 'description', 'logo', 'city'];

// Used by read/update/delete – requires an approved seller
const resolveSellerProfile = async (userId) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  if (profile.status === 'Suspended') {
    throw new ApiError(403, 'Your seller account is suspended and cannot create new marketplace activity');
  }
  if (profile.status !== 'Approved') throw new ApiError(403, 'Your seller account is not approved');
  return profile;
};

// Create a store during onboarding – only needs a seller profile, not approval
export const createStore = async (userId, data) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  if (profile.status === 'Suspended') {
    throw new ApiError(403, 'Your seller account is suspended and cannot create new marketplace activity');
  }
  // No approval check – the seller is still in the application phase

  const existing = await storeRepo.findBySeller(profile._id);
  if (existing) throw new ApiError(403, 'You already own a store');

  return storeRepo.create({ ...data, sellerProfile: profile._id });
};

// Public store lookup. A suspended seller's store must be invisible to customers
// (neutral 404 — no internal "suspended" wording). We check the owning profile's
// status rather than just store.isActive so the suspension state is honored.
export const getPublicStore = async (storeId) => {
  const store = await storeRepo.findById(storeId);
  if (!store) throw new ApiError(404, 'Store not found');
  // M-001: a deactivated/soft-deleted store (Store.isActive === false) must not
  // be visible to customers even when the owning seller is Approved. The
  // sellerProfile check below handles suspension; this additional check honors
  // the Store.isActive flag so a store owner cannot leave an inactive store public.
  if (!store.isActive) throw new ApiError(404, 'Store not found');
  if (store.sellerProfile) {
    const owner = await sellerProfileRepo.findById(store.sellerProfile);
    if (!owner || owner.status === 'Suspended') {
      throw new ApiError(404, 'Store not found');
    }
  }
  return store;
};

export const getMyStore = async (userId) => {
  // For dashboard switching / admin viewing seller layout,
  // do NOT throw errors when no seller profile or store exists.
  const profile = await sellerProfileRepo.findByUser(userId);

  if (!profile) {
    return null;
  }

  if (profile.status !== 'Approved') {
    return null;
  }

  const store = await storeRepo.findBySeller(profile._id);
  return store || null;
};

export const updateMyStore = async (userId, data) => {
  const profile = await resolveSellerProfile(userId);
  const store = await storeRepo.findBySeller(profile._id);
  if (!store) throw new ApiError(404, 'Store not found');
  const safeUpdate = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (data[key] !== undefined) safeUpdate[key] = data[key];
  }
  return storeRepo.updateById(store._id, safeUpdate);
};

export const deleteMyStore = async (userId) => {
  const profile = await resolveSellerProfile(userId);
  const store = await storeRepo.findBySeller(profile._id);
  if (!store) throw new ApiError(404, 'Store not found');
  return storeRepo.updateById(store._id, { isActive: false });
};
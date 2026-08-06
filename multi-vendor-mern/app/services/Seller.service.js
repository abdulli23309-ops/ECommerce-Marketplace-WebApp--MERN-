import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const getProfile = (userId) => sellerProfileRepo.findByUser(userId);

export const createProfile = async (userId, data) => {
  const existing = await sellerProfileRepo.findByUser(userId);
  if (existing) throw new ApiError(409, 'You already have a seller profile');
  return sellerProfileRepo.create({ user: userId, ...data });
};
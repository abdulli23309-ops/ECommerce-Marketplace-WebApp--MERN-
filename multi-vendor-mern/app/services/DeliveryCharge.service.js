import * as deliveryChargeRepo from '../repositories/DeliveryCharge.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const getDeliveryChargeBySellerProfile = (sellerProfileId) =>
  deliveryChargeRepo.findBySellerProfile(sellerProfileId);

export const upsertDeliveryCharge = async (sellerProfileId, data) => {
  if (!sellerProfileId) throw new ApiError(400, 'Seller profile ID is required');
  return deliveryChargeRepo.upsert(sellerProfileId, data);
};

export const listDeliveryCharges = () => deliveryChargeRepo.findAll();
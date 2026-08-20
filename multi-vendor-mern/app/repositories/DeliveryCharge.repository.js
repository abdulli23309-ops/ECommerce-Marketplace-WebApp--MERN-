import DeliveryCharge from '../models/DeliveryCharge.model.js';

export const findBySellerProfile = (sellerProfileId) =>
  DeliveryCharge.findOne({ sellerProfile: sellerProfileId, isActive: true }).lean();

export const upsert = async (sellerProfileId, data) => {
  return DeliveryCharge.findOneAndUpdate(
    { sellerProfile: sellerProfileId },
    { ...data, sellerProfile: sellerProfileId },
    { new: true, upsert: true, runValidators: true }
  );
};

export const findAll = () =>
  DeliveryCharge.find({ isActive: true })
    .populate('sellerProfile', 'businessName user')
    .lean();
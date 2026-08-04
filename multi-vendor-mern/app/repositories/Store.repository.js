import Store from '../models/Store.model.js';
import mongoose from 'mongoose';

export const findBySeller = (sellerProfileId) => {
  return Store.findOne({ sellerProfile: sellerProfileId });
};

export const create = (data) => {
  return Store.create(data);
};

export const findById = (id) => {
  return Store.findById(id);
};

export const updateById = (id, data) => {
  return Store.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const findAllBySeller = (sellerProfileId) =>
  Store.find({ sellerProfile: sellerProfileId });

// Get IDs of stores belonging to approved sellers
export const getActiveStoreIdsForApprovedSellers = async () => {
  const approvedSellerIds = await mongoose.model('SellerProfile')
    .find({ isApproved: true })
    .distinct('_id');
  const activeStores = await Store.find({
    sellerProfile: { $in: approvedSellerIds },
    isActive: true,
  }).select('_id');
  return activeStores.map(s => s._id);
};
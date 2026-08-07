import Store from '../models/Store.model.js';
import mongoose from 'mongoose';

export const findBySeller = (sellerProfileId) =>
  Store.findOne({ sellerProfile: sellerProfileId });

export const create = (data) => Store.create(data);

// Single findById with populate and lean
export const findById = (storeId) =>
  Store.findById(storeId).populate('sellerProfile', 'user').lean();

export const updateById = (id, data) =>
  Store.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export const findAllBySeller = (sellerProfileId) =>
  Store.find({ sellerProfile: sellerProfileId });

export const getActiveStoreIdsForApprovedSellers = async () => {
  const approvedSellerIds = await mongoose.model('SellerProfile')
    .find({ status: 'Approved' })
    .distinct('_id');
  const activeStores = await Store.find({
    sellerProfile: { $in: approvedSellerIds },
    isActive: true,
  }).select('_id');
  return activeStores.map(s => s._id);
};
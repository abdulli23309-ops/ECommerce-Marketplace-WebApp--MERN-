import Store from '../models/Store.model.js';

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
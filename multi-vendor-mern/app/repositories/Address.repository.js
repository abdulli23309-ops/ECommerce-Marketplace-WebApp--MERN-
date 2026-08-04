import Address from '../models/Address.model.js';

// Get all addresses for a user
export const findByUser = (userId) =>
  Address.find({ user: userId }).sort({ createdAt: -1 });

// Get a single address by ID (with ownership check)
export const findById = (id, userId) =>
  Address.findOne({ _id: id, user: userId });

// Create a new address
export const create = (data) => Address.create(data);

// Update an address
export const updateById = (id, userId, data) =>
  Address.findOneAndUpdate({ _id: id, user: userId }, data, {
    new: true,
    runValidators: true,
  });

// Delete an address
export const deleteById = (id, userId) =>
  Address.findOneAndDelete({ _id: id, user: userId });

// Unset all default addresses for a user (called before setting a new default)
export const unsetAllDefaults = (userId) =>
  Address.updateMany({ user: userId, isDefault: true }, { isDefault: false });

// Set a specific address as default
export const setDefault = (id, userId) =>
  Address.findOneAndUpdate(
    { _id: id, user: userId },
    { isDefault: true },
    { new: true }
  );
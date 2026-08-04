import * as addressRepo from '../repositories/Address.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const getUserAddresses = (userId) => addressRepo.findByUser(userId);

export const createAddress = async (userId, data) => {
  const existingCount = await addressRepo.findByUser(userId).countDocuments();

  // If this is the user's first address, automatically make it default
  const newAddressData = { ...data, user: userId };
  if (existingCount === 0) {
    newAddressData.isDefault = true;
  } else if (data.isDefault) {
    // If the new address is being set as default, unset previous defaults
    await addressRepo.unsetAllDefaults(userId);
  }

  return addressRepo.create(newAddressData);
};

export const updateAddress = async (id, userId, data) => {
  const address = await addressRepo.findById(id, userId);
  if (!address) throw new ApiError(404, 'Address not found');

  // If updating isDefault to true, unset others first
  if (data.isDefault) {
    await addressRepo.unsetAllDefaults(userId);
  }

  return addressRepo.updateById(id, userId, data);
};

export const deleteAddress = async (id, userId) => {
  const address = await addressRepo.findById(id, userId);
  if (!address) throw new ApiError(404, 'Address not found');
  await addressRepo.deleteById(id, userId);
};

export const setDefaultAddress = async (id, userId) => {
  const address = await addressRepo.findById(id, userId);
  if (!address) throw new ApiError(404, 'Address not found');
  await addressRepo.unsetAllDefaults(userId);
  return addressRepo.setDefault(id, userId);
};
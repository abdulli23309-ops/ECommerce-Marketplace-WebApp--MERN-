import * as addressService from '../services/Address.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.getUserAddresses(req.user.id);
  new ApiResponse(200, addresses, 'Addresses retrieved').send(res);
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.createAddress(req.user.id, req.body);
  new ApiResponse(201, address, 'Address created').send(res);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(req.params.id, req.user.id, req.body);
  new ApiResponse(200, address, 'Address updated').send(res);
});

export const deleteAddress = asyncHandler(async (req, res) => {
  await addressService.deleteAddress(req.params.id, req.user.id);
  new ApiResponse(200, null, 'Address deleted').send(res);
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await addressService.setDefaultAddress(req.params.id, req.user.id);
  new ApiResponse(200, address, 'Default address set').send(res);
});
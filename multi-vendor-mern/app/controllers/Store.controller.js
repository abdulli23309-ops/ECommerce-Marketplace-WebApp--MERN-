import * as storeService from '../services/Store.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createStore = asyncHandler(async (req, res) => {
  const imagePaths = (req.files || []).map(file => `/uploads/products/${file.filename}`);
  const data = {
    ...req.body,
    logo: imagePaths.length > 0 ? imagePaths[0] : req.body.logo || null,
  };
  const store = await storeService.createStore(req.user.id, data);
  new ApiResponse(201, store, 'Store created').send(res);
});
export const getPublicStore = asyncHandler(async (req, res) => {
  const store = await storeService.getPublicStore(req.params.id);
  new ApiResponse(200, store, 'Store retrieved').send(res);
});

export const getMyStore = asyncHandler(async (req, res) => {
  const store = await storeService.getMyStore(req.user.id);
  new ApiResponse(200, store, 'Store retrieved').send(res);
});

export const updateMyStore = asyncHandler(async (req, res) => {
  const store = await storeService.updateMyStore(req.user.id, req.body);
  new ApiResponse(200, store, 'Store updated').send(res);
});

export const deleteMyStore = asyncHandler(async (req, res) => {
  await storeService.deleteMyStore(req.user.id);
  new ApiResponse(200, null, 'Store deactivated').send(res);
});

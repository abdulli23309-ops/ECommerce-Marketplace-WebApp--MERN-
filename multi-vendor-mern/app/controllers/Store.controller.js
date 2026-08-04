import * as storeService from '../services/Store.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createStore = asyncHandler(async (req, res) => {
  const store = await storeService.createStore(req.user.id, req.body, req.user.permissions);
  new ApiResponse(201, store, 'Store created').send(res);
});

export const getMyStores = asyncHandler(async (req, res) => {
  const stores = await storeService.getMyStores(req.user.id);
  new ApiResponse(200, stores, 'Stores retrieved').send(res);
});

export const updateStore = asyncHandler(async (req, res) => {
  const store = await storeService.updateStore(req.user.id, req.params.id, req.body);
  new ApiResponse(200, store, 'Store updated').send(res);
});

export const deleteStore = asyncHandler(async (req, res) => {
  await storeService.deleteStore(req.user.id, req.params.id);
  new ApiResponse(200, null, 'Store deactivated').send(res);
});
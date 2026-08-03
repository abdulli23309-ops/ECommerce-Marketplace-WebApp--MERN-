import * as storeService from '../services/Store.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

const createStore = asyncHandler(async (req, res) => {
  const store = await storeService.createStore(req.user.id, req.body, req.user.permissions);
  new ApiResponse(201, store, 'Store created').send(res);
});

const getMyStore = asyncHandler(async (req, res) => {
  const store = await storeService.getMyStore(req.user.id);
  new ApiResponse(200, store, 'Store retrieved').send(res);
});

const updateMyStore = asyncHandler(async (req, res) => {
  const store = await storeService.updateMyStore(req.user.id, req.body);
  new ApiResponse(200, store, 'Store updated').send(res);
});

export { createStore, getMyStore, updateMyStore };

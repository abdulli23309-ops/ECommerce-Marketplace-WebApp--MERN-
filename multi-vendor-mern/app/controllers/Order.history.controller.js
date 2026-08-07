import * as orderHistoryService from '../services/Order.history.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getMyOrders = asyncHandler(async (req, res) => {
  const data = await orderHistoryService.getMyOrders(req.user.id, req.query);
  new ApiResponse(200, data, 'Orders retrieved').send(res);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderHistoryService.getOrderById(req.params.id, req.user.id);
  new ApiResponse(200, order, 'Order retrieved').send(res);
});
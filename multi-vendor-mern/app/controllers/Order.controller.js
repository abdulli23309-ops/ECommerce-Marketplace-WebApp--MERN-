import * as orderService from '../services/Order.service.js';
import SellerOrder from '../models/SellerOrder.model.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { ApiError } from '../utils/ApiError.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const checkout = asyncHandler(async (req, res) => {
  const result = await orderService.checkout(
    req.user.id,
    req.body.addressId,
    req.body.couponCode || null
  );

  new ApiResponse(201, result, 'Order placed successfully').send(res);
});
export const getSellerOrderById = asyncHandler(async (req, res) => {
  const order = await SellerOrder.findById(req.params.id)
    .populate('store', 'name')
    .populate('items.product', 'name images')   // ← added 'images'
    .lean();
  if (!order) throw new ApiError(404, 'Seller order not found');
  new ApiResponse(200, order, 'Seller order retrieved').send(res);
});
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user.id);
  new ApiResponse(200, order, 'Order cancelled').send(res);
});
export const getOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getOrders(req.user.id, req.query);
  new ApiResponse(200, result, 'Orders retrieved').send(res);
});
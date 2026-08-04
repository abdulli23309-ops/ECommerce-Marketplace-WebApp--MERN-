import * as orderService from '../services/Order.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const checkout = asyncHandler(async (req, res) => {
  const order = await orderService.checkout(req.user.id, req.body.addressId);
  new ApiResponse(201, order, 'Order placed successfully').send(res);
});
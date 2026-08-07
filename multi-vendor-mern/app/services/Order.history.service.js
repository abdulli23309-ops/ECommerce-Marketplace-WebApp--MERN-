import * as orderRepo from '../repositories/Order.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const getMyOrders = (userId, queryParams = {}) =>
  orderRepo.findByCustomer(userId, queryParams);

export const getOrderById = async (id, userId) => {
  const order = await orderRepo.findById(id, userId);
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
};
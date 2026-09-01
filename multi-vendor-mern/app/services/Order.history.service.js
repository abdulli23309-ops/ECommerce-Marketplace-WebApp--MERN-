import * as orderRepo from '../repositories/Order.repository.js';
import * as returnRepo from '../repositories/Return.repository.js';
import { ApiError } from '../utils/ApiError.util.js';
import { isWithinReturnWindow, RETURN_WINDOW_DAYS } from './Return.service.js';

export const getMyOrders = (userId, queryParams = {}) =>
  orderRepo.findByCustomer(userId, queryParams);

export const getOrderById = async (id, userId) => {
  const order = await orderRepo.findById(id, userId);
  if (!order) throw new ApiError(404, 'Order not found');

  // Enrich each seller order (package) with its return status so the UI can
  // hide "Request Return" once a return exists and respect the return window.
  const sellerOrders = order.sellerOrders || [];
  const sellerOrderIds = sellerOrders.map((so) => so._id);

  let returnsBySellerOrder = new Map();
  if (sellerOrderIds.length > 0) {
    const returns = await returnRepo.findBySellerOrderIds(sellerOrderIds);
    // A package can only have one return (enforced by service + unique index),
    // but guard anyway and keep the most recent.
    returns.forEach((ret) => {
      const key = ret.sellerOrder.toString();
      const existing = returnsBySellerOrder.get(key);
      if (!existing || new Date(ret.createdAt) > new Date(existing.createdAt)) {
        returnsBySellerOrder.set(key, ret);
      }
    });
  }

  return {
    ...order,
    sellerOrders: sellerOrders.map((so) => {
      const existingReturn = returnsBySellerOrder.get(so._id.toString());
      return {
        ...so,
        returnInfo: {
          exists: Boolean(existingReturn),
          returnId: existingReturn?._id || null,
          returnNumber: existingReturn?.returnNumber || null,
          status: existingReturn?.status || null,
          canRequestReturn:
            so.status === 'Delivered' &&
            !existingReturn &&
            isWithinReturnWindow(so),
          returnWindowDays: RETURN_WINDOW_DAYS,
        },
      };
    }),
  };
};
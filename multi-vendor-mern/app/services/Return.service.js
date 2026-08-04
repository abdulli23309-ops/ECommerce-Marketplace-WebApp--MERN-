import * as returnRepo from '../repositories/Return.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createReturn = async (customerId, data) => {
  const { productId, sellerOrderId, reason, images } = data;

  const sellerOrder = await orderRepo.findSellerOrderById(sellerOrderId);
  if (!sellerOrder) throw new ApiError(404, 'Seller order not found');

  const parentOrder = await orderRepo.findById(sellerOrder.parentOrder, customerId);
  if (!parentOrder) throw new ApiError(404, 'Order not found or not yours');

  if (sellerOrder.status !== 'Delivered') {
    throw new ApiError(400, 'Return is only available for delivered items');
  }

  const itemExists = sellerOrder.items.some(
    (item) => item.product.toString() === productId
  );
  if (!itemExists) throw new ApiError(400, 'Product not found in this order');

  return returnRepo.create({
    customer: customerId,
    product: productId,
    sellerOrder: sellerOrderId,
    reason,
    images,
  });
};

export const getMyReturns = (customerId) => returnRepo.findByCustomer(customerId);

export const processReturn = async (returnId, status, adminId, rejectionReason) => {
  const returnRequest = await returnRepo.findById(returnId);
  if (!returnRequest) throw new ApiError(404, 'Return request not found');
  if (returnRequest.status !== 'Requested') throw new ApiError(400, 'Return already processed');

  return returnRepo.updateStatus(returnId, status, adminId, rejectionReason);
};
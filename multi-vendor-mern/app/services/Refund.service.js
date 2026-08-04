import * as refundRepo from '../repositories/Refund.repository.js';
import * as returnRepo from '../repositories/Return.repository.js';
import * as paymentRepo from '../repositories/Payment.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createRefund = async (returnRequestId, adminId) => {
  const returnRequest = await returnRepo.findById(returnRequestId);
  if (!returnRequest) throw new ApiError(404, 'Return request not found');
  if (returnRequest.status !== 'Approved') throw new ApiError(400, 'Return is not approved');

  const existing = await refundRepo.findByReturnRequest(returnRequestId);
  if (existing) throw new ApiError(409, 'Refund already exists for this return');

  const sellerOrder = await orderRepo.findSellerOrderById(returnRequest.sellerOrder);
  const payment = await paymentRepo.findByParentOrder(sellerOrder.parentOrder);
  if (!payment) throw new ApiError(404, 'Payment not found');

  return refundRepo.create({
    returnRequest: returnRequestId,
    payment: payment._id,
    amount: payment.amount,
    status: 'Completed',
    processedBy: adminId,
    processedAt: new Date(),
    reason: 'Refund for return request',
  });
};

export const getRefundByReturn = (returnRequestId) =>
  refundRepo.findByReturnRequest(returnRequestId);
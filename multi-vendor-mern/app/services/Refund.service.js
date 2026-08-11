import * as refundRepo from '../repositories/Refund.repository.js';
import * as returnRepo from '../repositories/Return.repository.js';
import * as paymentRepo from '../repositories/Payment.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createRefund = async (returnRequestId, adminId) => {
  const returnRequest = await returnRepo.findById(returnRequestId);
  if (!returnRequest) throw new ApiError(404, 'Return request not found');

  // Allow refund only when seller has confirmed receipt, or if already refunded (idempotency)
  if (!['SELLER_RECEIVED', 'INSPECTED_AND_REFUNDED'].includes(returnRequest.status)) {
    throw new ApiError(400, 'Return is not ready for refund');
  }

  // Prevent duplicate refund
  if (returnRequest.status === 'INSPECTED_AND_REFUNDED') {
    throw new ApiError(400, 'Refund has already been processed for this return');
  }

  const existing = await refundRepo.findByReturnRequest(returnRequestId);
  if (existing) throw new ApiError(409, 'Refund already exists for this return');

  const sellerOrder = await orderRepo.findSellerOrderById(returnRequest.sellerOrder);
  if (!sellerOrder) throw new ApiError(404, 'Seller order not found');

  const payment = await paymentRepo.findByParentOrder(sellerOrder.parentOrder);
  if (!payment) throw new ApiError(404, 'Payment not found');

  // Create refund record
  const refund = await refundRepo.create({
    returnRequest: returnRequestId,
    payment: payment._id,
    amount: payment.amount,
    status: 'Completed',
    processedBy: adminId,
    processedAt: new Date(),
    reason: 'Refund for return request',
  });

  // Update return request status to refund completed
  await returnRepo.updateById(returnRequestId, {
    status: 'INSPECTED_AND_REFUNDED',
    processedBy: adminId,
    processedAt: new Date(),
  });

  return refund;
};

export const getRefundByReturn = (returnRequestId) =>
  refundRepo.findByReturnRequest(returnRequestId);
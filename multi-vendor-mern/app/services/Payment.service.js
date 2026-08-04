import * as paymentRepo from '../repositories/Payment.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createPayment = async (parentOrderId, userId) => {
  // Verify order exists and belongs to the customer
  const order = await orderRepo.findById(parentOrderId, userId);
  if (!order) throw new ApiError(404, 'Order not found');

  // Check for existing payment
  const existing = await paymentRepo.findByParentOrder(parentOrderId);
  if (existing) throw new ApiError(409, 'Payment already exists for this order');

  // Create dummy payment (always Completed)
  const payment = await paymentRepo.create({
    parentOrder: parentOrderId,
    amount: order.totalAmount,
    method: 'Dummy',
    status: 'Completed',
    paidAt: new Date(),
  });

  // Update parent order status to 'Processing'
  await orderRepo.updateStatus(parentOrderId, 'Processing');

  return payment;
};

export const getPaymentStatus = async (parentOrderId, userId) => {
  const order = await orderRepo.findById(parentOrderId, userId);
  if (!order) throw new ApiError(404, 'Order not found');
  const payment = await paymentRepo.findByParentOrder(parentOrderId);
  if (!payment) throw new ApiError(404, 'Payment not found');
  return payment;
};
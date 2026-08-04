import * as paymentService from '../services/Payment.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.createPayment(req.body.parentOrderId, req.user.id);
  new ApiResponse(201, payment, 'Payment processed').send(res);
});

export const getPaymentStatus = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentStatus(req.params.parentOrderId, req.user.id);
  new ApiResponse(200, payment, 'Payment status retrieved').send(res);
});
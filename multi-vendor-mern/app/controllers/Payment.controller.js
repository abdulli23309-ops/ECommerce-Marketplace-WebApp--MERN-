import * as paymentService from '../services/Payment.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getPaymentStatus = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentStatus(req.params.parentOrderId, req.user.id);
  new ApiResponse(200, payment, 'Payment status retrieved').send(res);
});

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod, couponCode = null, mobileAccount = null } = req.body;

  const result = await paymentService.createPaymentIntent(
    req.user.id,
    addressId,
    paymentMethod,
    couponCode,
    mobileAccount
  );

  new ApiResponse(200, result, 'Payment intent created').send(res);
});

export const getPaymentByOrder = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentByOrderId(req.params.orderId, req.user.id);
  new ApiResponse(200, payment, 'Payment retrieved').send(res);
});
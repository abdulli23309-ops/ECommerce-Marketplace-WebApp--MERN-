import * as refundService from '../services/Refund.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.createRefund(req.body.returnRequestId, req.user.id);
  new ApiResponse(201, refund, 'Refund processed').send(res);
});

export const getRefundByReturn = asyncHandler(async (req, res) => {
  const refund = await refundService.getRefundByReturn(req.params.returnRequestId);
  new ApiResponse(200, refund, 'Refund retrieved').send(res);
});
import * as returnService from '../services/Return.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createReturn = asyncHandler(async (req, res) => {
  const returnReq = await returnService.createReturn(req.user.id, req.body);
  new ApiResponse(201, returnReq, 'Return request created').send(res);
});

export const getMyReturns = asyncHandler(async (req, res) => {
  const returns = await returnService.getMyReturns(req.user.id);
  new ApiResponse(200, returns, 'Returns retrieved').send(res);
});

export const processReturn = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const returnReq = await returnService.processReturn(
    req.params.id,
    status,
    req.user.id,
    rejectionReason
  );
  new ApiResponse(200, returnReq, 'Return processed').send(res);
});
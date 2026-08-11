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

export const uploadReturnImage = asyncHandler(async (req, res) => {
  const imagePaths = (req.files || []).map(file => `/uploads/products/${file.filename}`);
  if (imagePaths.length === 0) throw new ApiError(400, 'No image uploaded');
  new ApiResponse(200, { url: imagePaths[0] }, 'Image uploaded').send(res);
});

export const getAdminReturns = asyncHandler(async (req, res) => {
  // Admins can see all returns; filter by status if provided in query
  const filter = req.query.status ? { status: req.query.status } : {};
  const returns = await returnService.getAllReturns(filter);
  new ApiResponse(200, returns, 'Admin returns retrieved').send(res);
});

export const adminDecision = asyncHandler(async (req, res) => {
  const { decision, adminNotes } = req.body;
  const result = await returnService.adminDecision(req.params.id, decision, req.user.id, adminNotes);
  new ApiResponse(200, result, 'Admin decision recorded').send(res);
});

export const getSellerReturns = asyncHandler(async (req, res) => {
  const returns = await returnService.getSellerReturns(req.user.id);
  new ApiResponse(200, returns, 'Seller returns retrieved').send(res);
});

export const sellerDecision = asyncHandler(async (req, res) => {
  const { decision, sellerNotes } = req.body;
  const result = await returnService.sellerDecision(req.params.id, decision, req.user.id, sellerNotes);
  new ApiResponse(200, result, 'Seller decision recorded').send(res);
});

export const processRefund = asyncHandler(async (req, res) => {
  const result = await returnService.processRefund(req.params.id, req.user.id);
  new ApiResponse(200, result, 'Refund processed').send(res);
});
export const updateTracking = asyncHandler(async (req, res) => {
  const { trackingNumber } = req.body;
  const result = await returnService.updateTracking(
    req.params.id,
    req.user.id,
    trackingNumber
  );
  new ApiResponse(200, result, 'Tracking updated').send(res);
});
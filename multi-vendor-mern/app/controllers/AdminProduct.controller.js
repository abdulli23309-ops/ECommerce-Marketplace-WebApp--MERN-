import * as adminProductService from '../services/AdminProduct.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getAllProducts = asyncHandler(async (req, res) => {
  const data = await adminProductService.getAllProducts(req.query);
  new ApiResponse(200, data, 'Products retrieved').send(res);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await adminProductService.getProductById(req.params.id);
  new ApiResponse(200, product, 'Product retrieved').send(res);
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const { status, reason, internalNote } = req.body;

  const product = await adminProductService.updateProductStatus(
    req.params.id,
    status,
    reason,
    internalNote,
    req.user.id
  );

  new ApiResponse(200, product, 'Product status updated').send(res);
});

export const getProductModerationStatus = asyncHandler(async (req, res) => {
  const status = await adminProductService.getProductModerationStatus(req.params.id);
  new ApiResponse(200, status, 'Product moderation status retrieved').send(res);
});

export const warnProduct = asyncHandler(async (req, res) => {
  const product = await adminProductService.warnProduct(
    req.params.id,
    req.body.reason,
    req.user.id
  );
  new ApiResponse(200, product, 'Product warning issued').send(res);
});

export const getProductStats = asyncHandler(async (req, res) => {
  const stats = await adminProductService.getProductStats();
  new ApiResponse(200, stats, 'Product statistics retrieved').send(res);
});
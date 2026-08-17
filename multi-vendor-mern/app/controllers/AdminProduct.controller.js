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
  const { status, rejectionReason, internalNote } = req.body;

  const updatedProduct = await adminProductService.updateProductStatus(
    req.params.id,
    status,
    rejectionReason,
    internalNote
  );

  new ApiResponse(200, updatedProduct, 'Product status updated').send(res);
});

export const getProductStats = asyncHandler(async (req, res) => {
  const stats = await adminProductService.getProductStats();
  new ApiResponse(200, stats, 'Product statistics retrieved').send(res);
});
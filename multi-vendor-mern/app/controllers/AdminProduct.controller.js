import * as adminProductService from '../services/AdminProduct.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getAllProducts = asyncHandler(async (req, res) => {
  console.log('🔵 Controller getAllProducts called');
  const data = await adminProductService.getAllProducts(req.query);
  new ApiResponse(200, data, 'Products retrieved').send(res);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await adminProductService.getProductById(req.params.id);
  new ApiResponse(200, product, 'Product retrieved').send(res);
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const { status, reason, internalNote } = req.body;
  const updatedProduct = await adminProductService.updateProductStatus(
    req.params.id,
    status,
    reason,
    internalNote
  );
  new ApiResponse(200, updatedProduct, 'Product status updated').send(res);
});
import * as productService from '../services/Product.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.user.id, req.body);
  new ApiResponse(201, product, 'Product created').send(res);
});

export const getMyProducts = asyncHandler(async (req, res) => {
  const products = await productService.getMyProducts(req.user.id, req.query);
  new ApiResponse(200, products, 'Products retrieved').send(res);
});

export const updateMyProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateMyProduct(req.user.id, req.params.id, req.body);
  new ApiResponse(200, product, 'Product updated').send(res);
});

export const deleteMyProduct = asyncHandler(async (req, res) => {
  await productService.deleteMyProduct(req.user.id, req.params.id);
  new ApiResponse(200, null, 'Product deleted').send(res);
});
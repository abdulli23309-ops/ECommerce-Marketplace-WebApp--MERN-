import * as productService from '../services/Product.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createProduct = asyncHandler(async (req, res) => {
  // Multer adds req.files; convert each file to its relative path
  const imagePaths = (req.files || []).map(file => `/uploads/products/${file.filename}`);
  const data = { ...req.body, images: imagePaths };
  const product = await productService.createProduct(req.user.id, data);
  new ApiResponse(201, product, 'Product created').send(res);
});

export const updateMyProduct = asyncHandler(async (req, res) => {
  const imagePaths = (req.files || []).map(file => `/uploads/products/${file.filename}`);
  // Only override images if files were actually uploaded
  const data = { ...req.body };
  if (imagePaths.length > 0) data.images = imagePaths;
  const product = await productService.updateMyProduct(req.user.id, req.params.id, data);
  new ApiResponse(200, product, 'Product updated').send(res);
});

// getMyProducts, deleteMyProduct remain unchanged
export const getMyProducts = asyncHandler(async (req, res) => {
  const products = await productService.getMyProducts(req.user.id, req.query);
  new ApiResponse(200, products, 'Products retrieved').send(res);
});

export const deleteMyProduct = asyncHandler(async (req, res) => {
  await productService.deleteMyProduct(req.user.id, req.params.id);
  new ApiResponse(200, null, 'Product deleted').send(res);
});
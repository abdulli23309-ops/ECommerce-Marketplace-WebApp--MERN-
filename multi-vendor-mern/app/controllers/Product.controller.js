import * as productService from '../services/Product.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';
import { ApiError } from '../utils/ApiError.util.js';

// Helper to collect existing image URLs from the request body
const getExistingImages = (body) => {
  if (!body.existingImages) return [];
  // FormData sends multiple values as array; single value as string
  return Array.isArray(body.existingImages) ? body.existingImages : [body.existingImages];
};

// Helper to generate new image paths from uploaded files
const getNewImagePaths = (files) =>
  (files || []).map((file) => `/uploads/products/${file.filename}`);

export const createProduct = asyncHandler(async (req, res) => {
  const imagePaths = getNewImagePaths(req.files);
  const data = { ...req.body, images: imagePaths };
  const product = await productService.createProduct(req.user.id, data);
  new ApiResponse(201, product, 'Product created').send(res);
});

export const updateMyProduct = asyncHandler(async (req, res) => {
  // Images the user wants to keep from the original product
  const existingImages = getExistingImages(req.body);
  // Newly uploaded images
  const newImagePaths = getNewImagePaths(req.files);

  // Merge: keep existing first, then add new ones
  const mergedImages = [...existingImages, ...newImagePaths];

  // Remove the raw existingImages from body to prevent it from being saved as a field
  delete req.body.existingImages;

  const data = {
    ...req.body,
    images: mergedImages,
  };

  const product = await productService.updateMyProduct(req.user.id, req.params.id, data);
  new ApiResponse(200, product, 'Product updated').send(res);
});

export const getMyProducts = asyncHandler(async (req, res) => {
  const products = await productService.getMyProducts(req.user.id, req.query);
  new ApiResponse(200, products, 'Products retrieved').send(res);
});
export const getMyProductById = asyncHandler(async (req, res) => {
  const product = await productService.getMyProductById(req.user.id, req.params.id);
  new ApiResponse(200, product, 'Product retrieved').send(res);
});

// Republish a Suspended product (only reachable after reinstatement since
// resolveStore blocks suspended sellers). Resets product warningCount to 0 (D5).
export const republishMyProduct = asyncHandler(async (req, res) => {
  const product = await productService.republishMyProduct(req.user.id, req.params.id);
  new ApiResponse(200, product, 'Product submitted for re-approval').send(res);
});

export const deleteMyProduct = asyncHandler(async (req, res) => {
  await productService.deleteMyProduct(req.user.id, req.params.id);
  new ApiResponse(200, null, 'Product deleted').send(res);
});

export const uploadImage = asyncHandler(async (req, res) => {
  const imagePaths = getNewImagePaths(req.files);
  if (imagePaths.length === 0) throw new ApiError(400, 'No image uploaded');
  new ApiResponse(200, { url: imagePaths[0] }, 'Image uploaded').send(res);
});
// M-028: the duplicated getPublicProducts handler was removed. The active
// public catalog API is Product.public.controller (mounted at
// /api/v1/products via Product.public.routes.js); this seller-scoped router
// (authenticate + requireRole('Seller')) never exposed it.
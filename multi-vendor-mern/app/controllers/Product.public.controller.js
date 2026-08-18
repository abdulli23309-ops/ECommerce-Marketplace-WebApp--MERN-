import * as publicService from '../services/Product.public.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getAll = asyncHandler(async (req, res) => {
  const result = await publicService.getPublicProducts(req.query);
  new ApiResponse(200, result, 'Products retrieved').send(res);
});

export const getById = asyncHandler(async (req, res) => {
  const product = await publicService.getPublicProductById(req.params.id);
  new ApiResponse(200, product, 'Product retrieved').send(res);
});

export const getSuggestions = asyncHandler(async (req, res) => {
  const result = await publicService.getSuggestions(req.query.q);
  new ApiResponse(200, result, 'Suggestions retrieved').send(res);
});
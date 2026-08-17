import * as brandService from '../services/Brand.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.createBrand(req.body);
  new ApiResponse(201, brand, 'Brand created').send(res);
});

export const getAllBrands = asyncHandler(async (req, res) => {
  const brands = await brandService.getAllBrands();
  new ApiResponse(200, brands, 'Brands retrieved').send(res);
});

export const getPaginatedBrands = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(req.query.pageSize, 10) || 10, 1),
    100
  );
  const search = (req.query.search || "").trim();
  const sortBy = req.query.sortBy || "newest";

  const data = await brandService.getPaginatedBrands({
    page,
    pageSize,
    search,
    sortBy,
  });

  new ApiResponse(200, data, 'Brands retrieved').send(res);
});

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.updateBrand(req.params.id, req.body);
  new ApiResponse(200, brand, 'Brand updated').send(res);
});

export const deleteBrand = asyncHandler(async (req, res) => {
  await brandService.deleteBrand(req.params.id);
  new ApiResponse(200, null, 'Brand deleted').send(res);
});
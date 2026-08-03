import * as subCategoryService from '../services/SubCategory.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createSubCategory = asyncHandler(async (req, res) => {
  const sub = await subCategoryService.createSubCategory(req.body);
  new ApiResponse(201, sub, 'SubCategory created').send(res);
});
export const getAllSubCategories = asyncHandler(async (req, res) => {
  const subs = await subCategoryService.getAllSubCategories();
  new ApiResponse(200, subs, 'SubCategories retrieved').send(res);
});
export const updateSubCategory = asyncHandler(async (req, res) => {
  const sub = await subCategoryService.updateSubCategory(req.params.id, req.body);
  new ApiResponse(200, sub, 'SubCategory updated').send(res);
});
export const deleteSubCategory = asyncHandler(async (req, res) => {
  await subCategoryService.deleteSubCategory(req.params.id);
  new ApiResponse(200, null, 'SubCategory deleted').send(res);
});
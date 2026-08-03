import * as categoryService from '../services/Category.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  new ApiResponse(201, category, 'Category created').send(res);
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  new ApiResponse(200, categories, 'Categories retrieved').send(res);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  new ApiResponse(200, category, 'Category updated').send(res);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  new ApiResponse(200, null, 'Category deleted').send(res);
});
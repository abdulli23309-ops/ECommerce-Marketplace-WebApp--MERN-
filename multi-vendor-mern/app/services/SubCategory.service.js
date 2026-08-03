import * as subCategoryRepo from '../repositories/SubCategory.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createSubCategory = (data) => subCategoryRepo.create(data);
export const getAllSubCategories = () => subCategoryRepo.findAll();
export const updateSubCategory = async (id, data) => {
  const sub = await subCategoryRepo.findById(id);
  if (!sub) throw new ApiError(404, 'SubCategory not found');
  return subCategoryRepo.updateById(id, data);
};
export const deleteSubCategory = async (id) => {
  const sub = await subCategoryRepo.findById(id);
  if (!sub) throw new ApiError(404, 'SubCategory not found');
  return subCategoryRepo.softDelete(id);
};
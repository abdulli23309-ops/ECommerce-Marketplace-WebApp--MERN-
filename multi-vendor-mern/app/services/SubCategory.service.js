import * as subCategoryRepo from '../repositories/SubCategory.repository.js';
import Product from '../models/Product.model.js';
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

  // 1. Soft‑delete the subcategory and mark it inactive
  await subCategoryRepo.updateById(id, { isDeleted: true, isActive: false });

  // 2. Suspend all products under this subcategory
  await Product.updateMany(
    { subCategory: id, isDeleted: false },
    { status: 'Suspended' }
  );

  return { success: true };
};
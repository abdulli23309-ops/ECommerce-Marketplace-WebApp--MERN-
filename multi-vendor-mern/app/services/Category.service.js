import * as categoryRepo from '../repositories/Category.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createCategory = (data) => categoryRepo.create(data);

export const getAllCategories = () => categoryRepo.findAll();

export const updateCategory = async (id, data) => {
  const category = await categoryRepo.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  return categoryRepo.updateById(id, data);
};

export const deleteCategory = async (id) => {
  const category = await categoryRepo.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  return categoryRepo.softDelete(id);
};
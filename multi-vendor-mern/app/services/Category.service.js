import * as categoryRepo from '../repositories/Category.repository.js';
import SubCategory from '../models/SubCategory.model.js';
import Product from '../models/Product.model.js';
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

  // 1. Soft‑delete the category and mark it inactive
  await categoryRepo.updateById(id, { isDeleted: true, isActive: false });

  // 2. Soft‑delete all child subcategories and mark them inactive
  const subCategories = await SubCategory.find({ category: id });
  const subCategoryIds = subCategories.map((sub) => sub._id);
  await SubCategory.updateMany(
    { _id: { $in: subCategoryIds } },
    { isDeleted: true, isActive: false }
  );

  // 3. Suspend all products under those subcategories so they are no longer publicly purchasable
  if (subCategoryIds.length > 0) {
    await Product.updateMany(
      { subCategory: { $in: subCategoryIds }, isDeleted: false },
      { status: 'Suspended' }
    );
  }

  return { success: true };
};
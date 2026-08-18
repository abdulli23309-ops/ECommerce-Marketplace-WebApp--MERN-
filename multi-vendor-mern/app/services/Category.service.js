import * as categoryRepo from '../repositories/Category.repository.js';
import SubCategory from '../models/SubCategory.model.js';
import Product from '../models/Product.model.js';
import { logAction } from './AdminAuditLog.service.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createCategory = async (data, adminId) => {
  const category = await categoryRepo.create(data);
  if (adminId) {
    await logAction(adminId, 'category.create', 'Category', category._id, {
      name: category.name,
    });
  }
  return category;
};

export const getAllCategories = () => categoryRepo.findAll();

export const updateCategory = async (id, data, adminId) => {
  const category = await categoryRepo.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');

  const updated = await categoryRepo.updateById(id, data);
  if (adminId) {
    await logAction(adminId, 'category.update', 'Category', id, data);
  }
  return updated;
};

export const deleteCategory = async (id, adminId) => {
  const category = await categoryRepo.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');

  // 1. Soft-delete the category and mark it inactive
  await categoryRepo.updateById(id, { isDeleted: true, isActive: false });

  // 2. Soft-delete all child subcategories and mark them inactive
  const subCategories = await SubCategory.find({ category: id });
  const subCategoryIds = subCategories.map((sub) => sub._id);
  await SubCategory.updateMany(
    { _id: { $in: subCategoryIds } },
    { isDeleted: true, isActive: false }
  );

  // 3. Suspend all products under those subcategories
  if (subCategoryIds.length > 0) {
    await Product.updateMany(
      { subCategory: { $in: subCategoryIds }, isDeleted: false },
      { status: 'Suspended' }
    );
  }

  if (adminId) {
    await logAction(adminId, 'category.delete', 'Category', id, {
      name: category.name,
    });
  }

  return { success: true };
};
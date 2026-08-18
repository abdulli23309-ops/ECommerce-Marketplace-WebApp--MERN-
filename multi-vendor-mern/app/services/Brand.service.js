import * as brandRepo from '../repositories/Brand.repository.js';
import Product from '../models/Product.model.js';
import { logAction } from './AdminAuditLog.service.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createBrand = async (data, adminId) => {
  const brand = await brandRepo.create(data);
  if (adminId) {
    await logAction(adminId, 'brand.create', 'Brand', brand._id, {
      name: brand.name,
    });
  }
  return brand;
};

export const getAllBrands = () => brandRepo.findAll();

export const getPaginatedBrands = (options) => brandRepo.findAllPaginated(options);

export const updateBrand = async (id, data, adminId) => {
  const brand = await brandRepo.findById(id);
  if (!brand) throw new ApiError(404, 'Brand not found');

  const updated = await brandRepo.updateById(id, data);
  if (adminId) {
    await logAction(adminId, 'brand.update', 'Brand', id, data);
  }
  return updated;
};

export const deleteBrand = async (id, adminId) => {
  const brand = await brandRepo.findById(id);
  if (!brand) throw new ApiError(404, 'Brand not found');

  await brandRepo.updateById(id, { isDeleted: true, isActive: false });

  await Product.updateMany(
    { brand: id, isDeleted: false },
    { status: 'Suspended' }
  );

  if (adminId) {
    await logAction(adminId, 'brand.delete', 'Brand', id, {
      name: brand.name,
    });
  }

  return { success: true };
};
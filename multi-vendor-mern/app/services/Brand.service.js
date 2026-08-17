import * as brandRepo from '../repositories/Brand.repository.js';
import Product from '../models/Product.model.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createBrand = (data) => brandRepo.create(data);

export const getAllBrands = () => brandRepo.findAll();

export const getPaginatedBrands = (options) => brandRepo.findAllPaginated(options);

export const updateBrand = async (id, data) => {
  const brand = await brandRepo.findById(id);
  if (!brand) throw new ApiError(404, 'Brand not found');
  return brandRepo.updateById(id, data);
};

export const deleteBrand = async (id) => {
  const brand = await brandRepo.findById(id);
  if (!brand) throw new ApiError(404, 'Brand not found');

  await brandRepo.updateById(id, { isDeleted: true, isActive: false });

  await Product.updateMany(
    { brand: id, isDeleted: false },
    { status: 'Suspended' }
  );

  return { success: true };
};
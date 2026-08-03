import * as brandRepo from '../repositories/Brand.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createBrand = (data) => brandRepo.create(data);
export const getAllBrands = () => brandRepo.findAll();
export const updateBrand = async (id, data) => {
  const brand = await brandRepo.findById(id);
  if (!brand) throw new ApiError(404, 'Brand not found');
  return brandRepo.updateById(id, data);
};
export const deleteBrand = async (id) => {
  const brand = await brandRepo.findById(id);
  if (!brand) throw new ApiError(404, 'Brand not found');
  return brandRepo.softDelete(id);
};
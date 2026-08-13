import * as brandRepo from '../repositories/Brand.repository.js';
import Product from '../models/Product.model.js';
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

  // 1. Soft‑delete the brand and mark it inactive
  //    (mirrors Category cascade: soft-delete + isActive false)
  await brandRepo.updateById(id, { isDeleted: true, isActive: false });

  // 2. Suspend all non‑deleted products that reference this brand
  //    This makes them unavailable in public listings, store pages,
  //    direct product API, cart, and checkout.
  await Product.updateMany(
    { brand: id, isDeleted: false },
    { status: 'Suspended' }
  );

  return { success: true };
};
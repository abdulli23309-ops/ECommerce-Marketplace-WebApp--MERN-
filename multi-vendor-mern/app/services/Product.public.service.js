import * as productRepo from '../repositories/Product.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const getPublicProducts = (filters) => productRepo.findPublicWithFilters(filters);

export const getPublicProductById = async (id) => {
  const product = await productRepo.findPublicById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};
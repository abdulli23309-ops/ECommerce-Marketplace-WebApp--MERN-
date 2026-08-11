import * as productRepo from '../repositories/Product.repository.js';

export const getAllProducts = (filters) => productRepo.findAllAdmin(filters);

export const getProductById = (productId) =>
  productRepo.findByIdAdmin(productId);

export const updateProductStatus = async (productId, status, reason, internalNote) => {
  const update = { status };
  if (reason) update.rejectionReason = reason;
  if (internalNote) update.internalNote = internalNote;
  return productRepo.updateById(productId, update);
};
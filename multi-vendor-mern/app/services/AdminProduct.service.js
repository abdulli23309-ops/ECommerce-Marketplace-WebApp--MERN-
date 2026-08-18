import * as productRepo from '../repositories/Product.repository.js';
import { logAction } from './AdminAuditLog.service.js';

export const getAllProducts = (filters) => productRepo.findAllAdmin(filters);

export const getProductById = (productId) =>
  productRepo.findByIdAdmin(productId);

export const updateProductStatus = async (
  productId,
  status,
  reason,
  internalNote,
  adminId
) => {
  const update = { status };

  if (reason) update.rejectionReason = reason;
  if (internalNote) update.internalNote = internalNote;

  if (status === 'Approved') {
    update.approvedAt = new Date();
  }

  const product = await productRepo.updateById(productId, update);

  if (adminId) {
    await logAction(adminId, 'product.moderation', 'Product', productId, {
      status,
      reason,
      internalNote,
    });
  }

  return product;
};

export const getProductStats = () => productRepo.getAdminProductStats();
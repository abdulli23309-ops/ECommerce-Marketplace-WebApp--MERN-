import * as productRepo from '../repositories/Product.repository.js';
import Product from '../models/Product.model.js';
import Store from '../models/Store.model.js';
import SellerProfile from '../models/SellerProfile.model.js';
import { logAction } from './AdminAuditLog.service.js';
import { createNotification } from './Notification.service.js';
import * as ratingModerationService from './RatingModeration.service.js';

const notifySellerProductStatus = async (productId, status, reason) => {
  const product = await Product.findById(productId).select('name store').lean();
  if (!product?.store) return;

  const store = await Store.findById(product.store).select('sellerProfile').lean();
  if (!store?.sellerProfile) return;

  const sellerProfile = await SellerProfile.findById(store.sellerProfile).select('user').lean();
  if (!sellerProfile?.user) return;

  let title = 'Product Status Updated';
  let message = `Your product "${product.name}" status is now ${status}.`;
  const link = '/seller/products';

  if (status === 'Rejected' && reason) {
    message += ` Reason: ${reason}`;
  }

  await createNotification(
    sellerProfile.user,
    'seller',
    title,
    message,
    link,
    { productId: productId.toString(), status }
  );
};

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

  // Notify seller about product status change
  await notifySellerProductStatus(productId, status, reason);

  return product;
};

export const getProductModerationStatus = (productId) =>
  ratingModerationService.getProductModerationStatus(productId);

export const warnProduct = (productId, reason, adminId) =>
  ratingModerationService.issueProductWarning(productId, adminId, reason);

export const getProductStats = () => productRepo.getAdminProductStats();
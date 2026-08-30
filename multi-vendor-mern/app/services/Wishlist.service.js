import * as wishlistRepo from '../repositories/Wishlist.repository.js';
import * as productRepo from '../repositories/Product.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

const ensureWishlist = async (userId) => {
  let wishlist = await wishlistRepo.findByUser(userId);
  if (!wishlist) {
    wishlist = await wishlistRepo.create(userId);
  }
  return wishlist;
};

export const getWishlist = (userId) => ensureWishlist(userId);

export const addProduct = async (userId, productId) => {
  const product = await productRepo.findPublicById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  // M-023: single atomic upsert handles both the first-time creation and the
  // existing-wishlist add, so concurrent first additions never race on the
  // unique `user` index or produce a generic 409, and duplicates never occur.
  return wishlistRepo.upsertAddProduct(userId, productId);
};

export const removeProduct = async (userId, productId) => {
  const wishlist = await wishlistRepo.removeProduct(userId, productId);
  if (!wishlist) throw new ApiError(404, 'Wishlist not found');
  return wishlist;
};

export const clearWishlist = async (userId) => {
  const wishlist = await wishlistRepo.clearWishlist(userId);
  if (!wishlist) throw new ApiError(404, 'Wishlist not found');
  return wishlist;
};
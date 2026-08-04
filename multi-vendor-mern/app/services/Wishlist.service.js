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
  
  let wishlist = await wishlistRepo.findByUser(userId);
  if (!wishlist) {
    wishlist = await wishlistRepo.create(userId, [productId]);
    return wishlist;
  }
  return wishlistRepo.addProduct(userId, productId);
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
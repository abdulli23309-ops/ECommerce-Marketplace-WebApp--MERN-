import Wishlist from '../models/Wishlist.model.js';

export const findByUser = (userId) => Wishlist.findOne({ user: userId });

export const create = (userId, products = []) =>
  Wishlist.create({ user: userId, products });

export const addProduct = async (userId, productId) => {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) return null;
  // Avoid duplicates
  if (!wishlist.products.includes(productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }
  return wishlist;
};

export const removeProduct = async (userId, productId) => {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) return null;
  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== productId
  );
  return wishlist.save();
};

export const clearWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) return null;
  wishlist.products = [];
  return wishlist.save();
};
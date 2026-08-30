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

// M-023: atomic upsert + $addToSet. A single findOneAndUpdate ensures that
// concurrent first-time additions cannot double-create the per-user Wishlist
// (unique index on `user`), and that a duplicate product is never re-added.
// Whether the wishlist already exists or is created here, the caller receives
// the final document — no check-then-act race, no generic 409.
export const upsertAddProduct = (userId, productId) =>
  Wishlist.findOneAndUpdate(
    { user: userId },
    { $addToSet: { products: productId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

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
import * as cartRepo from '../repositories/Cart.repository.js';
import * as productRepo from '../repositories/Product.repository.js';
import SellerProfile from '../models/SellerProfile.model.js';
import Store from '../models/Store.model.js';
import { ApiError } from '../utils/ApiError.util.js';

const getPopulatedCart = (userId) => cartRepo.findByUser(userId);

export const getCart = async (userId) => {
  let cart = await getPopulatedCart(userId);
  if (!cart) {
    cart = await cartRepo.create(userId);
    cart = await getPopulatedCart(userId);
  }
  return cart;
};

export const addItem = async (userId, productId, quantity) => {
  const product = await productRepo.findPublicById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  // Priority 5.11: Seller cannot add their own product to cart
  const sellerProfile = await SellerProfile.findOne({ user: userId }).lean();
  if (sellerProfile) {
    const storeId = product.store?._id || product.store;
    const store = await Store.findById(storeId).select('sellerProfile').lean();

    if (
      store?.sellerProfile &&
      store.sellerProfile.toString() === sellerProfile._id.toString()
    ) {
      throw new ApiError(
        400,
        'You cannot add your own product to your cart'
      );
    }
  }

  let cart = await cartRepo.findByUserForMutation(userId);

  if (!cart) {
    if (quantity > product.stock) {
      throw new ApiError(400, 'Insufficient stock');
    }
    await cartRepo.create(userId, [{ product: productId, quantity, price: product.price }]);
  } else {
    const existingItem = cart.items.find((i) => i.product.toString() === productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        throw new ApiError(
          400,
          `Insufficient stock. Only ${product.stock - existingItem.quantity} more available.`
        );
      }

      existingItem.quantity = newQuantity;
      existingItem.price = product.price;
    } else {
      if (quantity > product.stock) {
        throw new ApiError(400, 'Insufficient stock');
      }
      cart.items.push({ product: productId, quantity, price: product.price });
    }

    await cart.save();
  }

  return getPopulatedCart(userId);
};

// Keep other functions unchanged
export const updateItemQuantity = async (userId, productId, quantity) => {
  const product = await productRepo.findPublicById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < quantity) throw new ApiError(400, 'Insufficient stock');

  const cart = await cartRepo.updateItemQuantity(userId, productId, quantity);
  if (!cart) throw new ApiError(404, 'Cart or item not found');

  return getPopulatedCart(userId);
};

export const removeItem = async (userId, productId) => {
  const cart = await cartRepo.removeItem(userId, productId);
  if (!cart) throw new ApiError(404, 'Cart or item not found');
  return getPopulatedCart(userId);
};

export const clearCart = async (userId) => {
  await cartRepo.clearCart(userId);
  return getPopulatedCart(userId);
};
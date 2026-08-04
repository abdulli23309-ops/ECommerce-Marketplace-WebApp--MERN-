import * as cartRepo from '../repositories/Cart.repository.js';
import * as productRepo from '../repositories/Product.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

const ensureCart = async (userId) => {
  let cart = await cartRepo.findByUser(userId);
  if (!cart) {
    cart = await cartRepo.create(userId);
  }
  return cart;
};

export const getCart = (userId) => ensureCart(userId);

export const addItem = async (userId, productId, quantity) => {
  const product = await productRepo.findPublicById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < quantity) throw new ApiError(400, 'Insufficient stock');

  let cart = await cartRepo.findByUser(userId);
  if (!cart) {
    cart = await cartRepo.create(userId, [{ product: productId, quantity, price: product.price }]);
    return cart;
  }

  const existingItem = cart.items.find((i) => i.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = product.price; // refresh price
  } else {
    cart.items.push({ product: productId, quantity, price: product.price });
  }
  return cart.save();
};

export const updateItemQuantity = async (userId, productId, quantity) => {
  const product = await productRepo.findPublicById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < quantity) throw new ApiError(400, 'Insufficient stock');

  const cart = await cartRepo.updateItemQuantity(userId, productId, quantity);
  if (!cart) throw new ApiError(404, 'Cart or item not found');
  return cart;
};

export const removeItem = async (userId, productId) => {
  const cart = await cartRepo.removeItem(userId, productId);
  if (!cart) throw new ApiError(404, 'Cart or item not found');
  return cart;
};

export const clearCart = async (userId) => {
  const cart = await cartRepo.clearCart(userId);
  if (!cart) throw new ApiError(404, 'Cart not found');
  return cart;
};
import * as cartRepo from '../repositories/Cart.repository.js';
import * as productRepo from '../repositories/Product.repository.js';
import * as storeRepo from '../repositories/Store.repository.js';
import SellerProfile from '../models/SellerProfile.model.js';
import Store from '../models/Store.model.js';
import { ApiError } from '../utils/ApiError.util.js';
import Product from '../models/Product.model.js';

const getPopulatedCart = (userId) => cartRepo.findByUser(userId);

/**
 * Enrich cart items with an `available` flag computed live via the public
 * product predicate (same as findPublicById). Uses a single batched query.
 * Does NOT modify the Cart model or persist the flag.
 */
const enrichCartWithAvailability = async (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) return;

  const productIds = cart.items
    .map((item) => item.product?._id || item.product)
    .filter(Boolean);
  if (productIds.length === 0) return;

  const allowedStoreIds = await storeRepo.getPubliclyActiveStoreIds();
  const availableProducts = await Product.find(
    {
      _id: { $in: productIds },
      status: 'Approved',
      store: { $in: allowedStoreIds },
      isDeleted: false,
    },
    { _id: 1 }
  ).lean();

  const availableSet = new Set(availableProducts.map((p) => p._id.toString()));

  for (const item of cart.items) {
    const id = (item.product?._id || item.product)?.toString();
    item.available = id ? availableSet.has(id) : false;
  }
};

export const getCart = async (userId) => {
  let cart = await getPopulatedCart(userId);
  if (!cart) {
    cart = await cartRepo.create(userId);
    cart = await getPopulatedCart(userId);
  }
  await enrichCartWithAvailability(cart);
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

  const populatedCart = await getPopulatedCart(userId);
  await enrichCartWithAvailability(populatedCart);
  return populatedCart;
};

// Keep other functions unchanged
export const updateItemQuantity = async (userId, productId, quantity) => {
  const product = await productRepo.findPublicById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < quantity) throw new ApiError(400, 'Insufficient stock');

  const cart = await cartRepo.updateItemQuantity(userId, productId, quantity);
  if (!cart) throw new ApiError(404, 'Cart or item not found');

  const populatedCart = await getPopulatedCart(userId);
  await enrichCartWithAvailability(populatedCart);
  return populatedCart;
};

export const removeItem = async (userId, productId) => {
  const cart = await cartRepo.removeItem(userId, productId);
  if (!cart) throw new ApiError(404, 'Cart or item not found');
  const populatedCart = await getPopulatedCart(userId);
  await enrichCartWithAvailability(populatedCart);
  return populatedCart;
};

export const clearCart = async (userId) => {
  await cartRepo.clearCart(userId);
  const populatedCart = await getPopulatedCart(userId);
  await enrichCartWithAvailability(populatedCart);
  return populatedCart;
};
import Cart from '../models/Cart.model.js';

export const findByUser = (userId) =>
  Cart.findOne({ user: userId })
    .populate('items.product', 'name images price freeDelivery')
    .lean();

export const findByUserForMutation = (userId) =>
  Cart.findOne({ user: userId });

export const create = (userId, items = []) => Cart.create({ user: userId, items });

export const addItem = async (userId, item) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return null;
  cart.items.push(item);
  return cart.save();
};

export const updateItemQuantity = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return null;
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) return null;
  item.quantity = quantity;
  return cart.save();
};

export const removeItem = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return null;
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  return cart.save();
};

export const clearCart = async (userId, session = undefined) => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $set: { items: [] } },
    { new: true, session }
  );
  return cart;
};
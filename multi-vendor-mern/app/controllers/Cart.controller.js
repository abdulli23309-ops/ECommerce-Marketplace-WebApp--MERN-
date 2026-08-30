import * as cartService from '../services/cart.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  new ApiResponse(200, cart, 'Cart retrieved').send(res);
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const cart = await cartService.addItem(req.user.id, productId, quantity);
  new ApiResponse(200, cart, 'Item added').send(res);
});

export const updateItemQuantity = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.updateItemQuantity(req.user.id, productId, quantity);
  new ApiResponse(200, cart, 'Quantity updated').send(res);
});

export const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const cart = await cartService.removeItem(req.user.id, productId);
  new ApiResponse(200, cart, 'Item removed').send(res);
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user.id);
  new ApiResponse(200, cart, 'Cart cleared').send(res);
});
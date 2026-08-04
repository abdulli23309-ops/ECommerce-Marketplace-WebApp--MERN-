import * as wishlistService from '../services/Wishlist.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.id);
  new ApiResponse(200, wishlist, 'Wishlist retrieved').send(res);
});

export const addProduct = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const wishlist = await wishlistService.addProduct(req.user.id, productId);
  new ApiResponse(200, wishlist, 'Product added to wishlist').send(res);
});

export const removeProduct = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const wishlist = await wishlistService.removeProduct(req.user.id, productId);
  new ApiResponse(200, wishlist, 'Product removed from wishlist').send(res);
});

export const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.clearWishlist(req.user.id);
  new ApiResponse(200, wishlist, 'Wishlist cleared').send(res);
});
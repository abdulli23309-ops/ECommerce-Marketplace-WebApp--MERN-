import * as couponService from '../services/Coupon.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  new ApiResponse(201, coupon, 'Coupon created').send(res);
});

export const listCoupons = asyncHandler(async (req, res) => {
  const result = await couponService.listCoupons(req.query);
  new ApiResponse(200, result, 'Coupons retrieved').send(res);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  new ApiResponse(200, coupon, 'Coupon updated').send(res);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.deleteCoupon(req.params.id);
  new ApiResponse(200, coupon, 'Coupon deleted').send(res);
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;
  const coupon = await couponService.validateCoupon(code, cartTotal);
  const discount = couponService.calculateDiscount(coupon, cartTotal);
  new ApiResponse(200, { coupon, discount }, 'Coupon is valid').send(res);
});
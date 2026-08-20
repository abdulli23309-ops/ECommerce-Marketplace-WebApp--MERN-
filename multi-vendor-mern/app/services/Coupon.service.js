import * as couponRepo from '../repositories/Coupon.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const createCoupon = (data) => couponRepo.create(data);

export const listCoupons = async (query) => {
  const [items, total] = await couponRepo.findAllAdmin(query);
  return {
    items,
    total,
    page: Number(query.page || 1),
    pageSize: Number(query.pageSize || 20),
    totalPages: Math.ceil(total / Number(query.pageSize || 20)),
  };
};

export const updateCoupon = async (id, data) => {
  const coupon = await couponRepo.findById(id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  return couponRepo.updateById(id, data);
};

export const deleteCoupon = async (id) => {
  const coupon = await couponRepo.findById(id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  return couponRepo.softDelete(id);
};

export const validateCoupon = async (code, cartTotal) => {
  if (!code) throw new ApiError(400, 'Coupon code is required');

  const coupon = await couponRepo.findByCode(code);
  if (!coupon) throw new ApiError(404, 'Invalid coupon code');

  const now = new Date();
  if (now < coupon.startsAt || now > coupon.expiresAt) {
    throw new ApiError(400, 'Coupon has expired');
  }

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }

  if (cartTotal < coupon.minOrderAmount) {
    throw new ApiError(400, `Minimum order amount is ${coupon.minOrderAmount}`);
  }

  return coupon;
};

export const calculateDiscount = (coupon, cartTotal, deliveryTotal = 0) => {
  if (cartTotal < coupon.minOrderAmount) return 0;

  if (coupon.discountType === 'percentage') {
    let discount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount !== null) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
    return Math.min(discount, cartTotal);
  }

  if (coupon.discountType === 'fixed') {
    return Math.min(coupon.discountValue, cartTotal);
  }

  if (coupon.discountType === 'free_delivery') {
    return Math.min(deliveryTotal, coupon.discountValue || deliveryTotal);
  }

  return 0;
};
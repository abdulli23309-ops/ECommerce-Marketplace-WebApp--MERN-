import mongoose from 'mongoose';
import stripe from '../stripe.js';
import CouponUsage from '../models/CouponUsage.model.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';
import Product from '../models/Product.model.js';
import * as paymentRepo from '../repositories/Payment.repository.js';
import ParentOrder from '../models/ParentOrder.model.js';
import SellerOrder from '../models/SellerOrder.model.js';
import * as addressRepo from '../repositories/Address.repository.js';
import * as cartRepo from '../repositories/Cart.repository.js';
import * as productRepo from '../repositories/Product.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import * as couponService from './Coupon.service.js';
import * as couponRepo from '../repositories/Coupon.repository.js';
import { createNotification } from './Notification.service.js';
import { ApiError } from '../utils/ApiError.util.js';

export const checkout = async (userId, addressId, couponCode = null) => {
  const address = await addressRepo.findById(addressId, userId);
  if (!address) throw new ApiError(404, 'Address not found');

  const cart = await cartRepo.findByUser(userId);
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  const storeItemsMap = new Map();

  for (const cartItem of cart.items) {
    const product = await productRepo.findPublicById(cartItem.product);
    if (!product) throw new ApiError(404, `Product ${cartItem.product} not found`);
    if (product.stock < cartItem.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    const storeId = (product.store?._id || product.store).toString();

    if (!storeItemsMap.has(storeId)) storeItemsMap.set(storeId, []);
    storeItemsMap.get(storeId).push({
      product: product._id,
      productNameSnapshot: product.name,
      unitPriceSnapshot: product.price,
      quantity: cartItem.quantity,
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const parentOrder = await ParentOrder.create([{
      customer: userId,
      shippingFullName: address.fullName || address.street,
      shippingPhone: address.phoneNumber || '03001234567',
      shippingAddressLine1: address.street,
      shippingAddressLine2: address.addressLine2 || '',
      shippingCity: address.city,
      shippingState: address.state || '',
      shippingPostalCode: address.postalCode || '',
      totalAmount: 0,
      subtotal: 0,
      discountAmount: 0,
      couponCode: null,
    }], { session });

    const createdParent = parentOrder[0];
    let subtotalAmount = 0;

    for (const [storeIdStr, items] of storeItemsMap.entries()) {
      const subTotal = items.reduce((sum, item) => sum + item.unitPriceSnapshot * item.quantity, 0);
      subtotalAmount += subTotal;

      await SellerOrder.create([{
        parentOrder: createdParent._id,
        store: storeIdStr,
        subTotal,
        items,
      }], { session });

      for (const item of items) {
        await productRepo.deductStock(item.product, item.quantity, session);
      }
    }

    let appliedCoupon = null;
    let discountAmount = 0;

    if (couponCode) {
      appliedCoupon = await couponService.validateCoupon(couponCode, subtotalAmount);
      discountAmount = couponService.calculateDiscount(appliedCoupon, subtotalAmount);
    }

    const finalTotal = subtotalAmount - discountAmount;

    createdParent.subtotal = subtotalAmount;
    createdParent.discountAmount = discountAmount;
    createdParent.totalAmount = finalTotal;
    if (appliedCoupon) {
      createdParent.couponCode = appliedCoupon.code;
    }

    await createdParent.save({ session });

    if (appliedCoupon) {
  await couponRepo.incrementUsage(appliedCoupon._id, session);

  await CouponUsage.create([{
    coupon: appliedCoupon._id,
    user: userId,
    parentOrder: createdParent._id,
    discountAmount,
  }], { session });
}

    await cartRepo.clearCart(userId, session);

    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await ParentOrder.findById(createdParent._id)
      .populate({ path: 'sellerOrders', select: 'store subTotal status items' })
      .lean();

    return populatedOrder;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Checkout transaction failed:', error);
    throw error;
  }
};

export const prepareOrder = async (userId, addressId, session, couponCode = null) => {
  const address = await addressRepo.findById(addressId, userId);
  if (!address) throw new ApiError(404, 'Address not found');

  const cart = await cartRepo.findByUser(userId);
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  const storeItemsMap = new Map();
  for (const cartItem of cart.items) {
    const product = await productRepo.findPublicById(cartItem.product);
    if (!product) throw new ApiError(404, `Product ${cartItem.product} not found`);
    if (product.stock < cartItem.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    const storeId = (product.store?._id || product.store).toString();
    if (!storeItemsMap.has(storeId)) storeItemsMap.set(storeId, []);
    storeItemsMap.get(storeId).push({
      product: product._id,
      productNameSnapshot: product.name,
      unitPriceSnapshot: product.price,
      quantity: cartItem.quantity,
    });
  }

  const parentOrder = await ParentOrder.create([{
    customer: userId,
    shippingFullName: address.fullName || address.street,
    shippingPhone: address.phoneNumber || '03001234567',
    shippingAddressLine1: address.street,
    shippingAddressLine2: address.addressLine2 || '',
    shippingCity: address.city,
    shippingState: address.state || '',
    shippingPostalCode: address.postalCode || '',
    totalAmount: 0,
    subtotal: 0,
    discountAmount: 0,
    couponCode: null,
  }], { session });

  const createdParent = parentOrder[0];
  let subtotalAmount = 0;

  for (const [storeIdStr, items] of storeItemsMap.entries()) {
    const subTotal = items.reduce((sum, item) => sum + item.unitPriceSnapshot * item.quantity, 0);
    subtotalAmount += subTotal;

    await SellerOrder.create([{
      parentOrder: createdParent._id,
      store: storeIdStr,
      subTotal,
      items,
    }], { session });
  }

  let appliedCoupon = null;
  let discountAmount = 0;

  if (couponCode) {
    appliedCoupon = await couponService.validateCoupon(couponCode, subtotalAmount);
    discountAmount = couponService.calculateDiscount(appliedCoupon, subtotalAmount);
  }

  const finalTotal = subtotalAmount - discountAmount;

  createdParent.subtotal = subtotalAmount;
  createdParent.discountAmount = discountAmount;
  createdParent.totalAmount = finalTotal;
  if (appliedCoupon) {
    createdParent.couponCode = appliedCoupon.code;
  }

  await createdParent.save({ session });

  // Important: For `prepareOrder`, we deliberately do NOT increment usage yet.
  // The actual coupon redemption/increment should happen when payment is confirmed.
  // If your payment service later calls `checkout()` to finalize, remove this comment
  // and ensure `couponRepo.incrementUsage` is only called there.
  // If you want to redeem immediately after creating the pending order, uncomment:
  // if (appliedCoupon) await couponRepo.incrementUsage(appliedCoupon._id, session);

  return { parentOrder: createdParent, cart };
};

export const cancelOrder = async (orderId, userId) => {
  const parentOrder = await orderRepo.findByIdForMutation(orderId, userId);
  if (!parentOrder) throw new ApiError(404, 'Order not found');

  // ---------- Pending orders ----------
  if (parentOrder.orderStatus === 'Pending') {
    const sellerOrders = await orderRepo.findAllSellerOrdersByParentOrder(orderId);
    const payment = await paymentRepo.findByParentOrder(orderId);

    if (payment && payment.method === 'CashOnDelivery') {
      for (const so of sellerOrders) {
        for (const item of so.items || []) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } }
          );
        }
      }
    }

    await orderRepo.updateStatus(orderId, 'Cancelled');

    for (const so of sellerOrders) {
      await orderRepo.updateSellerOrderStatus(so._id, 'Cancelled');
    }

    await createNotification(
      userId,
      'order',
      'Order Cancelled',
      `Order ${orderId} has been cancelled.`,
      `/orders/${orderId}`,
      { parentOrderId: orderId }
    );

    return parentOrder;
  }

  // ---------- Processing Stripe orders ----------
  if (parentOrder.orderStatus === 'Processing') {
    const payment = await paymentRepo.findByParentOrder(orderId);

    if (!payment || payment.method !== 'Stripe' || payment.status !== 'Completed') {
      throw new ApiError(400, 'Only pending orders can be cancelled');
    }

    const sellerOrders = await orderRepo.findAllSellerOrdersByParentOrder(orderId);
    const anyProgressed = sellerOrders.some((so) => so.status !== 'Pending');

    if (anyProgressed) {
      throw new ApiError(
        400,
        'Order cannot be cancelled once a seller has started processing it. Please request a return after delivery instead.'
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      try {
        await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
      } catch (stripeError) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(502, 'Refund could not be processed, please try again or contact support');
      }

      payment.status = 'Refunded';
      await payment.save({ session });

      await PaymentTransaction.create([{
        payment: payment._id,
        type: 'refund',
        status: 'success',
        amount: payment.amount,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        stripeEventId: `manual-refund-${payment._id}-${Date.now()}`,
      }], { session });

      for (const so of sellerOrders) {
        for (const item of so.items || []) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
      }

      await orderRepo.updateStatus(orderId, 'Cancelled');

      for (const so of sellerOrders) {
        so.status = 'Cancelled';
        await so.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      // Send notification after transaction commits
      await createNotification(
        userId,
        'order',
        'Order Cancelled',
        `Order ${orderId} has been cancelled and refunded.`,
        `/orders/${orderId}`,
        { parentOrderId: orderId }
      );

      return parentOrder;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  throw new ApiError(400, 'Only pending orders can be cancelled');
};
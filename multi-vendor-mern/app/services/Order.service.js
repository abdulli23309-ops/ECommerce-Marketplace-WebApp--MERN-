import mongoose from 'mongoose';
import stripe from '../stripe.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';
import Product from '../models/Product.model.js';
import { sanitizePagination } from '../utils/pagination.js';
import * as paymentRepo from '../repositories/Payment.repository.js';
import ParentOrder from '../models/ParentOrder.model.js';
import SellerOrder from '../models/SellerOrder.model.js';
import * as addressRepo from '../repositories/Address.repository.js';
import * as cartRepo from '../repositories/Cart.repository.js';
import * as productRepo from '../repositories/Product.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import * as userRepo from '../repositories/User.repository.js';
import * as couponService from './Coupon.service.js';
import * as couponRepo from '../repositories/Coupon.repository.js';
import { createNotification } from './Notification.service.js';
import { ApiError } from '../utils/ApiError.util.js';
import CouponUsage from '../models/CouponUsage.model.js';
import Store from '../models/Store.model.js';
import SellerProfile from '../models/SellerProfile.model.js';
import DeliveryCharge from '../models/DeliveryCharge.model.js';
import Payment from '../models/Payment.model.js';

// ---------- Email verification guard ----------
const ensureEmailVerified = async (userId) => {
  const user = await userRepo.findById(userId, 'emailVerified');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.emailVerified) {
    throw new ApiError(403, 'Please verify your email before placing an order.');
  }
};

// ---------- Delivery charge helpers ----------
const getDeliveryChargeForStore = async (storeId) => {
  const store = await Store.findById(storeId).select('sellerProfile').lean();
  if (!store?.sellerProfile) return 0;

  const deliveryConfig = await DeliveryCharge.findOne({
    sellerProfile: store.sellerProfile,
    isActive: true,
  }).lean();

  if (!deliveryConfig) return 0;

  return deliveryConfig.baseCharge || 0;
};

const calculateSellerDelivery = async (storeId, items, subtotal) => {
  const deliveryCharge = await getDeliveryChargeForStore(storeId);

  const allFreeDelivery = items.every((item) => item.freeDelivery === true);

  if (allFreeDelivery) {
    return { deliveryCharge: 0, freeDeliveryApplied: true };
  }

  const store = await Store.findById(storeId).select('sellerProfile').lean();
  if (store?.sellerProfile) {
    const deliveryConfig = await DeliveryCharge.findOne({
      sellerProfile: store.sellerProfile,
      isActive: true,
    }).lean();

    if (deliveryConfig?.freeAbove && subtotal >= deliveryConfig.freeAbove) {
      return { deliveryCharge: 0, freeDeliveryApplied: true };
    }
  }

  return { deliveryCharge, freeDeliveryApplied: false };
};

// ---------- Checkout & prepare ----------
export const checkout = async (userId, addressId, couponCode = null) => {
  await ensureEmailVerified(userId);

  const address = await addressRepo.findById(addressId, userId);
  if (!address) throw new ApiError(404, 'Address not found');

  const cart = await cartRepo.findByUser(userId);
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  const storeItemsMap = new Map();
  const unavailableItems = [];

  for (const cartItem of cart.items) {
    const product = await productRepo.findPublicById(cartItem.product);
    if (!product) {
      // Use the cart item's product name for a clear error message;
      // fall back to Unknown Product if the name is not available.
      unavailableItems.push({
        productId: cartItem.product.toString(),
        productName: cartItem.product?.name || 'Unknown Product',
        quantity: cartItem.quantity,
      });
      continue;
    }
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
      freeDelivery: product.freeDelivery || false,
    });
  }

  if (unavailableItems.length > 0) {
    const names = unavailableItems.map((u) => u.productName).join(', ');
    throw new ApiError(
      400,
      `Some items in your cart are no longer available and cannot be ordered: ${names}. Please remove them to continue.`
    );
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
      deliveryCharges: 0,
      freeDeliveryDiscount: 0,
      couponCode: null,
    }], { session });

    const createdParent = parentOrder[0];
    let subtotalAmount = 0;
    let totalDeliveryCharges = 0;

    for (const [storeIdStr, items] of storeItemsMap.entries()) {
      const subTotal = items.reduce((sum, item) => sum + item.unitPriceSnapshot * item.quantity, 0);
      subtotalAmount += subTotal;

      const { deliveryCharge, freeDeliveryApplied } = await calculateSellerDelivery(
        storeIdStr,
        items,
        subTotal
      );

      totalDeliveryCharges += deliveryCharge;

      await SellerOrder.create([{
        parentOrder: createdParent._id,
        store: storeIdStr,
        subTotal,
        deliveryCharge,
        items,
      }], { session });

      for (const item of items) {
        await productRepo.deductStock(item.product, item.quantity, session);
      }
    }

    let appliedCoupon = null;
    let discountAmount = 0;
    let freeDeliveryDiscount = 0;

    if (couponCode) {
      appliedCoupon = await couponService.validateCoupon(couponCode, subtotalAmount);

      if (appliedCoupon.discountType === 'free_delivery') {
        freeDeliveryDiscount = couponService.calculateDiscount(
          appliedCoupon,
          subtotalAmount,
          totalDeliveryCharges
        );
      } else {
        discountAmount = couponService.calculateDiscount(appliedCoupon, subtotalAmount);
      }
    }

    const finalTotal =
      subtotalAmount - discountAmount + totalDeliveryCharges - freeDeliveryDiscount;

    createdParent.subtotal = subtotalAmount;
    createdParent.discountAmount = discountAmount;
    createdParent.deliveryCharges = totalDeliveryCharges;
    createdParent.freeDeliveryDiscount = freeDeliveryDiscount;
    createdParent.totalAmount = finalTotal;
    if (appliedCoupon) {
      createdParent.couponCode = appliedCoupon.code;
    }

    await createdParent.save({ session });

    if (appliedCoupon) {
      // M-015: enforce the usage limit atomically — the limit check and the
      // increment happen in one MongoDB update. If no document matches (limit
      // reached, or a concurrent redemption already took the final slot) the
      // update returns null and we fail cleanly like an exhausted coupon.
      const incremented = await couponRepo.incrementUsageIfAvailable(
        appliedCoupon._id,
        appliedCoupon.usageLimit,
        session
      );
      if (!incremented) {
        throw new ApiError(400, 'Coupon usage limit reached');
      }
      await CouponUsage.create([{
        coupon: appliedCoupon._id,
        user: userId,
        parentOrder: createdParent._id,
        discountAmount: appliedCoupon.discountValue || 0,
      }], { session });
    }

    await cartRepo.clearCart(userId, session);

    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await ParentOrder.findById(createdParent._id)
      .populate({ path: 'sellerOrders', select: 'store subTotal status items deliveryCharge' })
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
  await ensureEmailVerified(userId);

  const address = await addressRepo.findById(addressId, userId);
  if (!address) throw new ApiError(404, 'Address not found');

  const cart = await cartRepo.findByUser(userId);
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  const storeItemsMap = new Map();
  const unavailableItems = [];

  for (const cartItem of cart.items) {
    const product = await productRepo.findPublicById(cartItem.product);
    if (!product) {
      unavailableItems.push({
        productId: cartItem.product.toString(),
        productName: cartItem.product?.name || 'Unknown Product',
        quantity: cartItem.quantity,
      });
      continue;
    }
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
      freeDelivery: product.freeDelivery || false,
    });
  }

  if (unavailableItems.length > 0) {
    const names = unavailableItems.map((u) => u.productName).join(', ');
    throw new ApiError(
      400,
      `Some items in your cart are no longer available and cannot be ordered: ${names}. Please remove them to continue.`
    );
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
    deliveryCharges: 0,
    freeDeliveryDiscount: 0,
    couponCode: null,
  }], { session });

  const createdParent = parentOrder[0];
  let subtotalAmount = 0;
  let totalDeliveryCharges = 0;

  for (const [storeIdStr, items] of storeItemsMap.entries()) {
    const subTotal = items.reduce((sum, item) => sum + item.unitPriceSnapshot * item.quantity, 0);
    subtotalAmount += subTotal;

    const { deliveryCharge } = await calculateSellerDelivery(storeIdStr, items, subTotal);
    totalDeliveryCharges += deliveryCharge;

    await SellerOrder.create([{
      parentOrder: createdParent._id,
      store: storeIdStr,
      subTotal,
      deliveryCharge,
      items,
    }], { session });
  }

  let appliedCoupon = null;
  let discountAmount = 0;
  let freeDeliveryDiscount = 0;

  if (couponCode) {
    appliedCoupon = await couponService.validateCoupon(couponCode, subtotalAmount);

    if (appliedCoupon.discountType === 'free_delivery') {
      freeDeliveryDiscount = couponService.calculateDiscount(
        appliedCoupon,
        subtotalAmount,
        totalDeliveryCharges
      );
    } else {
      discountAmount = couponService.calculateDiscount(appliedCoupon, subtotalAmount);
    }
  }

  const finalTotal =
    subtotalAmount - discountAmount + totalDeliveryCharges - freeDeliveryDiscount;

  createdParent.subtotal = subtotalAmount;
  createdParent.discountAmount = discountAmount;
  createdParent.deliveryCharges = totalDeliveryCharges;
  createdParent.freeDeliveryDiscount = freeDeliveryDiscount;
  createdParent.totalAmount = finalTotal;
  if (appliedCoupon) {
    createdParent.couponCode = appliedCoupon.code;
  }

  await createdParent.save({ session });

  return { parentOrder: createdParent, cart };
};

// ---------- Order preview (read-only totals, no persistence) ----------
// Mirrors the totals math in prepareOrder/checkout so the checkout page can
// display the exact delivery charge and final total that will be charged,
// without creating an order or deducting stock.
export const previewOrderTotals = async (userId, couponCode = null) => {
  const emptyResult = {
    subtotal: 0,
    discountAmount: 0,
    deliveryCharges: 0,
    freeDeliveryDiscount: 0,
    total: 0,
    couponCode: null,
    unavailableItems: [],
  };

  const cart = await cartRepo.findByUser(userId);
  if (!cart || cart.items.length === 0) return emptyResult;

  const storeItemsMap = new Map();
  const unavailableItems = [];

  for (const cartItem of cart.items) {
    const product = await productRepo.findPublicById(cartItem.product);
    if (!product) {
      // Track unavailable items for the frontend to display
      const productName = cartItem.product?.name || 'Unknown Product';
      unavailableItems.push({
        productId: cartItem.product.toString(),
        productName,
        quantity: cartItem.quantity,
      });
      continue;
    }

    const storeId = (product.store?._id || product.store).toString();
    if (!storeItemsMap.has(storeId)) storeItemsMap.set(storeId, []);
    storeItemsMap.get(storeId).push({
      unitPriceSnapshot: product.price,
      quantity: cartItem.quantity,
      freeDelivery: product.freeDelivery || false,
    });
  }

  let subtotalAmount = 0;
  let totalDeliveryCharges = 0;

  for (const [storeIdStr, items] of storeItemsMap.entries()) {
    const subTotal = items.reduce((sum, item) => sum + item.unitPriceSnapshot * item.quantity, 0);
    subtotalAmount += subTotal;

    const { deliveryCharge } = await calculateSellerDelivery(storeIdStr, items, subTotal);
    totalDeliveryCharges += deliveryCharge;
  }

  let appliedCoupon = null;
  let discountAmount = 0;
  let freeDeliveryDiscount = 0;

  if (couponCode) {
    try {
      appliedCoupon = await couponService.validateCoupon(couponCode, subtotalAmount);

      if (appliedCoupon.discountType === 'free_delivery') {
        freeDeliveryDiscount = couponService.calculateDiscount(
          appliedCoupon,
          subtotalAmount,
          totalDeliveryCharges
        );
      } else {
        discountAmount = couponService.calculateDiscount(appliedCoupon, subtotalAmount);
      }
    } catch {
      // Invalid/expired coupon: show totals without a discount rather than failing the preview.
      appliedCoupon = null;
      discountAmount = 0;
      freeDeliveryDiscount = 0;
    }
  }

  const total =
    subtotalAmount - discountAmount + totalDeliveryCharges - freeDeliveryDiscount;

  return {
    subtotal: subtotalAmount,
    discountAmount,
    deliveryCharges: totalDeliveryCharges,
    freeDeliveryDiscount,
    total,
    couponCode: appliedCoupon ? appliedCoupon.code : null,
    unavailableItems,
  };
};

// ---------- Cancel order ----------
export const cancelOrder = async (orderId, userId) => {
  const parentOrder = await orderRepo.findByIdForMutation(orderId, userId);
  if (!parentOrder) throw new ApiError(404, 'Order not found');

  if (parentOrder.orderStatus === 'Pending') {
    const sellerOrders = await orderRepo.findAllSellerOrdersByParentOrder(orderId);
    const payment = await paymentRepo.findByParentOrder(orderId);

    if (payment) {
      if (payment.method === 'CashOnDelivery') {
        for (const so of sellerOrders) {
          for (const item of so.items || []) {
            await Product.updateOne(
              { _id: item.product },
              { $inc: { stock: item.quantity } }
            );
          }
        }
      } else if (payment.status === 'Pending') {
        payment.status = 'Failed';
        await payment.save();
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

// ---------- Order listing with payment info ----------
export const getOrders = async (userId, { page = 1, pageSize = 10 } = {}) => {
  const { page: safePage, pageSize: limit } = sanitizePagination(page, pageSize, 10);
  const skip = (safePage - 1) * limit;

  const [parentOrders, total] = await Promise.all([
    ParentOrder.find({ customer: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'sellerOrders',
        select: 'store subTotal status items deliveryCharge',
        populate: {
          path: 'store',
          select: 'name',
        },
      })
      .lean(),
    ParentOrder.countDocuments({ customer: userId }),
  ]);

  const parentOrderIds = parentOrders.map((order) => order._id);

  const payments = await Payment.find({
    parentOrder: { $in: parentOrderIds },
  })
    .select('parentOrder method status')
    .lean();

  const paymentMap = new Map();
  payments.forEach((p) => {
    paymentMap.set(p.parentOrder.toString(), p);
  });

  const items = parentOrders.map((order) => {
    const payment = paymentMap.get(order._id.toString());

    return {
      ...order,
      paymentMethod: payment?.method || null,
      paymentStatus: payment?.status || null,
    };
  });

  return {
    items,
    total,
    page: safePage,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ---------- Order detail with payment info ----------
export const getOrderById = async (orderId, userId) => {
  const order = await orderRepo.findById(orderId, userId);
  if (!order) throw new ApiError(404, 'Order not found');

  const payment = await Payment.findOne({ parentOrder: order._id })
    .select('method status transactionId')
    .lean();

  return {
    ...order.toObject(),
    paymentMethod: payment?.method || null,
    paymentStatus: payment?.status || null,
    paymentTransactionId: payment?.transactionId || null,
  };
};
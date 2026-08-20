import stripe from '../stripe.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';
import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import ParentOrder from '../models/ParentOrder.model.js';
import Coupon from '../models/Coupon.model.js';
import CouponUsage from '../models/CouponUsage.model.js';
import Store from '../models/Store.model.js';
import SellerProfile from '../models/SellerProfile.model.js';
import * as paymentRepo from '../repositories/Payment.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import * as orderService from './Order.service.js';
import * as couponService from './Coupon.service.js';
import { createPaymentProcessor } from './payment/PaymentFactory.js';
import { createNotification, notifyAdmins } from './Notification.service.js';
import { ApiError } from '../utils/ApiError.util.js';
import mongoose from 'mongoose';

// ---------- OLD dummy payment ----------
export const createPayment = async (parentOrderId, userId) => {
  const order = await orderRepo.findById(parentOrderId, userId);
  if (!order) throw new ApiError(404, 'Order not found');

  const existing = await paymentRepo.findByParentOrder(parentOrderId);
  if (existing) throw new ApiError(409, 'Payment already exists for this order');

  const payment = await paymentRepo.create({
    parentOrder: parentOrderId,
    amount: order.totalAmount,
    method: 'Dummy',
    status: 'Completed',
    paidAt: new Date(),
  });

  await orderRepo.updateStatus(parentOrderId, 'Processing');
  return payment;
};

// ---------- Stripe webhook signature verification ----------
export const verifyWebhookSignature = (rawBody, signature) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
};

// ---------- Notification helpers ----------
const notifyCustomerOrderPlaced = async (customerId, parentOrder) => {
  await createNotification(
    customerId,
    'order',
    'Order Placed Successfully',
    `Your order #${parentOrder._id} has been placed successfully.`,
    `/orders/${parentOrder._id}`,
    { parentOrderId: parentOrder._id.toString() }
  );
};

const notifySellersForNewOrder = async (parentOrderId) => {
  const sellerOrders = await orderRepo.findAllSellerOrdersByParentOrder(parentOrderId);

  for (const so of sellerOrders) {
    if (!so.store) continue;
    const store = await Store.findById(so.store).select('sellerProfile');
    if (!store) continue;
    const profile = await SellerProfile.findById(store.sellerProfile).select('user');
    if (!profile) continue;

    await createNotification(
      profile.user,
      'order',
      'New Order Received',
      `You received a new order worth PKR ${so.subTotal}.`,
      `/seller/orders`,
      { parentOrderId: parentOrderId.toString(), sellerOrderId: so._id.toString() }
    );
  }
};

const notifyLowStockForItems = async (sellerOrders) => {
  for (const so of sellerOrders) {
    for (const item of so.items || []) {
      const product = await Product.findById(item.product);
      if (!product || product.stock > 5) continue;

      const store = await Store.findById(so.store).select('sellerProfile');
      if (!store) continue;
      const profile = await SellerProfile.findById(store.sellerProfile).select('user');
      if (!profile) continue;

      await createNotification(
        profile.user,
        'inventory',
        'Low Stock Warning',
        `${product.name} has only ${product.stock} left in stock.`,
        `/seller/products`,
        { productId: product._id.toString(), stock: product.stock }
      );
    }
  }
};

const redeemCoupon = async (parentOrder, session) => {
  if (!parentOrder?.couponCode) return;

  const coupon = await Coupon.findOne({
    code: parentOrder.couponCode,
    isDeleted: false,
    isActive: true,
  }).session(session);

  if (!coupon) return;

  const existingUsage = await CouponUsage.findOne({
    parentOrder: parentOrder._id,
  }).session(session);

  if (existingUsage) return;

  await CouponUsage.create([{
    coupon: coupon._id,
    user: parentOrder.customer,
    parentOrder: parentOrder._id,
    discountAmount: parentOrder.discountAmount || 0,
  }], { session });

  coupon.usageCount += 1;
  await coupon.save({ session });
};

const createPaymentTransaction = async (payment, type, status, amount, metadata = {}) => {
  await PaymentTransaction.create({
    payment: payment._id,
    type,
    status,
    amount,
    stripeEventId: metadata.stripeEventId || `manual-${type}-${payment._id}-${Date.now()}`,
    ...metadata,
  });
};

const isValidMobileNumber = (mobileAccount) => {
  return /^03\d{9}$/.test(mobileAccount);
};

// ---------- Payment intent creation ----------
export const createPaymentIntent = async (userId, addressId, paymentMethod, couponCode = null, mobileAccount = null) => {
  if (!['Stripe', 'CashOnDelivery', 'EasyPaisa', 'JazzCash'].includes(paymentMethod)) {
    throw new ApiError(400, `Unsupported payment method: ${paymentMethod}`);
  }

  // Validate mobile number for wallet payments
  if (paymentMethod === 'EasyPaisa' || paymentMethod === 'JazzCash') {
    if (!mobileAccount || !isValidMobileNumber(mobileAccount)) {
      throw new ApiError(400, 'Invalid mobile account number. Use 03XXXXXXXXX.');
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  let parentOrder, payment;
  try {
    const result = await orderService.prepareOrder(userId, addressId, session, couponCode);
    parentOrder = result.parentOrder;

    const [paymentDoc] = await paymentRepo.create(
      [{
        parentOrder: parentOrder._id,
        amount: parentOrder.totalAmount,
        method: paymentMethod,
        status: 'Pending',
      }],
      { session }
    );
    payment = paymentDoc;

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  const processor = createPaymentProcessor(paymentMethod);
  let clientSecret = null;

  if (paymentMethod === 'Stripe') {
    try {
      const intent = await processor.createPaymentIntent(payment, parentOrder);
      payment.stripePaymentIntentId = intent.paymentIntentId;
      await payment.save();
      clientSecret = intent.clientSecret;
    } catch (stripeError) {
      payment.status = 'Failed';
      await payment.save();
      await createPaymentTransaction(payment, 'failure', 'failed', payment.amount, { failureReason: stripeError.message });
      throw new ApiError(502, 'Payment processing failed. Please try again.');
    }
  } else if (paymentMethod === 'CashOnDelivery') {
    await processor.process(payment, parentOrder);

    const sellerOrders = await orderRepo.findAllSellerOrdersByParentOrder(parentOrder._id);

    for (const so of sellerOrders) {
      for (const item of so.items || []) {
        await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    await Cart.updateOne({ user: userId }, { $set: { items: [] } });

    const redemptionSession = await mongoose.startSession();
    redemptionSession.startTransaction();
    try {
      await redeemCoupon(parentOrder, redemptionSession);
      await redemptionSession.commitTransaction();
      redemptionSession.endSession();
    } catch (error) {
      await redemptionSession.abortTransaction();
      redemptionSession.endSession();
    }

    await createPaymentTransaction(payment, 'success', 'success', payment.amount, { transactionId: payment.transactionId });

    await notifyCustomerOrderPlaced(userId, parentOrder);
    await notifySellersForNewOrder(parentOrder._id);
    await notifyLowStockForItems(sellerOrders);
  } else if (paymentMethod === 'EasyPaisa' || paymentMethod === 'JazzCash') {
    await processor.process(payment, parentOrder, mobileAccount);

    if (payment.status === 'Failed') {
      // Cancel the pending order to avoid orphans
      await ParentOrder.findByIdAndUpdate(parentOrder._id, { orderStatus: 'Cancelled' });

      // Create failure transaction
      await createPaymentTransaction(payment, 'failure', 'failed', payment.amount, {
        failureReason: `${paymentMethod} payment failed. Invalid test account.`,
      });

      throw new ApiError(400, `${paymentMethod} payment failed. Please use a valid test account.`);
    }

    const sellerOrders = await orderRepo.findAllSellerOrdersByParentOrder(parentOrder._id);

    for (const so of sellerOrders) {
      for (const item of so.items || []) {
        await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    await Cart.updateOne({ user: userId }, { $set: { items: [] } });

    const redemptionSession = await mongoose.startSession();
    redemptionSession.startTransaction();
    try {
      await redeemCoupon(parentOrder, redemptionSession);
      await redemptionSession.commitTransaction();
      redemptionSession.endSession();
    } catch (error) {
      await redemptionSession.abortTransaction();
      redemptionSession.endSession();
    }

    await createPaymentTransaction(payment, 'success', 'success', payment.amount, { transactionId: payment.transactionId });

    await notifyCustomerOrderPlaced(userId, parentOrder);
    await notifySellersForNewOrder(parentOrder._id);
    await notifyLowStockForItems(sellerOrders);
  }

  return {
    payment: payment.toObject(),
    order: parentOrder.toObject(),
    clientSecret,
  };
};

// ---------- Stripe webhook helpers ----------
export const handlePaymentSuccess = async (event) => {
  const paymentIntent = event.data.object;
  const stripePaymentIntentId = paymentIntent.id;
  const stripeEventId = event.id;

  const payment = await paymentRepo.findByStripePaymentIntentId(stripePaymentIntentId);
  if (!payment) return;

  const existingTx = await PaymentTransaction.findOne({ stripeEventId });
  if (existingTx) return;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentPayment = await paymentRepo.findByIdQuery(payment._id, session);
    if (!currentPayment || currentPayment.status !== 'Pending') {
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const parentOrder = await orderRepo.findByIdQuery(currentPayment.parentOrder, session);
    if (!parentOrder) throw new Error('ParentOrder not found');

    const sellerOrders = await orderRepo.findSellerOrdersByParentQuery(parentOrder._id, session);

    for (const so of sellerOrders) {
      for (const item of so.items) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );
        if (!updatedProduct) throw new Error(`Insufficient stock for product ${item.product}`);
      }
    }

    await PaymentTransaction.create([{
      payment: currentPayment._id,
      type: 'success',
      status: 'success',
      amount: currentPayment.amount,
      stripePaymentIntentId,
      stripeEventId,
    }], { session });

    currentPayment.status = 'Completed';
    currentPayment.paidAt = new Date();
    await currentPayment.save({ session });

    parentOrder.orderStatus = 'Processing';
    await parentOrder.save({ session });

    await redeemCoupon(parentOrder, session);
    await Cart.updateOne({ user: parentOrder.customer }, { $set: { items: [] } }, { session });

    await session.commitTransaction();
    session.endSession();

    await notifyCustomerOrderPlaced(parentOrder.customer, parentOrder);
    await notifySellersForNewOrder(parentOrder._id);
    await notifyLowStockForItems(sellerOrders);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (error.message.includes('Insufficient stock')) {
      await ParentOrder.findByIdAndUpdate(parentOrder._id, { orderStatus: 'Cancelled' });
    }
    throw error;
  }
};

export const handlePaymentFailure = async (event) => {
  const paymentIntent = event.data.object;
  const stripePaymentIntentId = paymentIntent.id;
  const stripeEventId = event.id;

  const payment = await paymentRepo.findByStripePaymentIntentId(stripePaymentIntentId);
  if (!payment) return;

  const existingTx = await PaymentTransaction.findOne({ stripeEventId });
  if (existingTx) return;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentPayment = await paymentRepo.findByIdQuery(payment._id, session);
    if (!currentPayment || currentPayment.status !== 'Pending') {
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

    await PaymentTransaction.create([{
      payment: currentPayment._id,
      type: 'failure',
      status: 'failed',
      amount: currentPayment.amount,
      stripePaymentIntentId,
      stripeEventId,
      failureReason,
    }], { session });

    currentPayment.status = 'Failed';
    await currentPayment.save({ session });

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getPaymentStatus = async (parentOrderId, userId) => {
  const order = await orderRepo.findById(parentOrderId, userId);
  if (!order) throw new ApiError(404, 'Order not found');
  const payment = await paymentRepo.findByParentOrder(parentOrderId);
  if (!payment) throw new ApiError(404, 'Payment not found');
  return payment;
};

export const getPaymentByOrderId = async (orderId, userId) => {
  const order = await orderRepo.findById(orderId, userId);
  if (!order) throw new ApiError(404, 'Order not found');
  const payment = await paymentRepo.findByParentOrder(orderId);
  if (!payment) throw new ApiError(404, 'Payment not found');
  return payment;
};
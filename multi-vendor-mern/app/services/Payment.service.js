import stripe from '../stripe.js';  // adjust path if needed
import PaymentTransaction from '../models/PaymentTransaction.model.js';
import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import SellerOrder from '../models/SellerOrder.model.js';
import ParentOrder from '../models/ParentOrder.model.js';  // used in catch block
import * as paymentRepo from '../repositories/Payment.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import * as orderService from './Order.service.js';
import { createPaymentProcessor } from './payment/PaymentFactory.js';
import { ApiError } from '../utils/ApiError.util.js';
import mongoose from 'mongoose';

// ---------- OLD dummy payment – keep for backward compatibility ----------
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

// ---------- NEW – Stripe/COD payment intent creation ----------
export const createPaymentIntent = async (userId, addressId, paymentMethod) => {
  if (!['Stripe', 'CashOnDelivery'].includes(paymentMethod)) {
    throw new ApiError(400, `Unsupported payment method: ${paymentMethod}`);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  let parentOrder, payment;
  try {
    const result = await orderService.prepareOrder(userId, addressId, session);
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

  // After commit, handle payment gateway (no DB transaction)
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
      throw new ApiError(502, 'Payment processing failed. Please try again.');
    }
 } else if (paymentMethod === 'CashOnDelivery') {
  await processor.process(payment, parentOrder);
  // COD order is confirmed – clear the cart immediately
  await Cart.updateOne(
    { user: userId },
    { $set: { items: [] } }
  );
}

  return {
    payment: payment.toObject(),
    order: parentOrder.toObject(),
    clientSecret,
  };
};

export const getPaymentStatus = async (parentOrderId, userId) => {
  const order = await orderRepo.findById(parentOrderId, userId);
  if (!order) throw new ApiError(404, 'Order not found');
  const payment = await paymentRepo.findByParentOrder(parentOrderId);
  if (!payment) throw new ApiError(404, 'Payment not found');
  return payment;
};

// ---------- Stripe webhook helpers ----------
export const verifyWebhookSignature = (rawBody, signature) => {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

// ---------- Process successful payment ----------
export const handlePaymentSuccess = async (event) => {
  const paymentIntent = event.data.object;
  const stripePaymentIntentId = paymentIntent.id;
  const stripeEventId = event.id;
const charge = paymentIntent.charges?.data?.[0];
const cardDetails = charge?.payment_method_details?.card;
const cardBrand = cardDetails?.brand || null;
const cardLast4 = cardDetails?.last4 || null;
const cardExpMonth = cardDetails?.exp_month || null;
const cardExpYear = cardDetails?.exp_year || null;

  console.log(`[WEBHOOK] Processing payment_intent.succeeded for PI: ${stripePaymentIntentId}`);

  const payment = await paymentRepo.findByStripePaymentIntentId(stripePaymentIntentId);
  if (!payment) {
    console.error(`[WEBHOOK] Payment not found for PI: ${stripePaymentIntentId}`);
    return;
  }

  console.log(`[WEBHOOK] Found payment ${payment._id} with status ${payment.status}`);

  // Idempotency check
  const existingTx = await PaymentTransaction.findOne({ stripeEventId });
  if (existingTx) {
    console.log(`[WEBHOOK] Duplicate event ignored: ${stripeEventId}`);
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentPayment = await paymentRepo.findByIdQuery(payment._id, session);
    if (!currentPayment || currentPayment.status !== 'Pending') {
      console.log(`[WEBHOOK] Payment not in Pending state, skipping: ${currentPayment?.status}`);
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const parentOrder = await orderRepo.findByIdQuery(currentPayment.parentOrder, session);
    if (!parentOrder) {
      throw new Error('ParentOrder not found');
    }

    console.log(`[WEBHOOK] Deducting stock for order ${parentOrder._id}`);

    const sellerOrders = await orderRepo.findSellerOrdersByParentQuery(parentOrder._id, session);
    for (const so of sellerOrders) {
      for (const item of so.items) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );
        if (!updatedProduct) {
          throw new Error(`Insufficient stock for product ${item.product}`);
        }
      }
    }

    console.log(`[WEBHOOK] Creating PaymentTransaction with eventId ${stripeEventId}`);

    await PaymentTransaction.create([{
      payment: currentPayment._id,
      type: 'success',
      status: 'success',
      amount: currentPayment.amount,
      stripePaymentIntentId,
      stripeEventId,
    }], { session });

    currentPayment.status = 'Completed';
    currentPayment.cardBrand = cardBrand;
currentPayment.cardLast4 = cardLast4;
currentPayment.cardExpMonth = cardExpMonth;
currentPayment.cardExpYear = cardExpYear;
    currentPayment.paidAt = new Date();
    await currentPayment.save({ session });

    parentOrder.orderStatus = 'Processing';
    await parentOrder.save({ session });

    console.log(`[WEBHOOK] Clearing cart for user ${parentOrder.customer}`);

    await Cart.updateOne(
      { user: parentOrder.customer },
      { $set: { items: [] } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    console.log(`[WEBHOOK] Successfully processed payment for order ${parentOrder._id}`);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error(`[WEBHOOK] Error processing payment: ${error.message}`);

    // If stock deduction failed, mark order as Cancelled
    if (error.message.includes('Insufficient stock')) {
      await ParentOrder.findByIdAndUpdate(parentOrder._id, { orderStatus: 'Cancelled' });
    }
    throw error; // rethrow to be caught by webhook handler
  }
};

// ---------- Process failed payment ----------
export const handlePaymentFailure = async (event) => {
  const paymentIntent = event.data.object;
  const stripePaymentIntentId = paymentIntent.id;
  const stripeEventId = event.id;

  const payment = await paymentRepo.findByStripePaymentIntentId(stripePaymentIntentId);
  if (!payment) {
    console.error(`Payment not found for PI: ${stripePaymentIntentId}`);
    return;
  }

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

    const failureReason =
      paymentIntent.last_payment_error?.message ||
      paymentIntent.last_payment_error?.code ||
      'Payment failed';

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
export const getPaymentByOrderId = async (orderId, userId) => {
  const order = await orderRepo.findById(orderId, userId);   // ensures ownership
  if (!order) throw new ApiError(404, 'Order not found');
  const payment = await paymentRepo.findByParentOrder(orderId);
  if (!payment) throw new ApiError(404, 'Payment not found');
  return payment;
};
import mongoose from 'mongoose';
import stripe from '../stripe.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';
import Product from '../models/Product.model.js';
import * as paymentRepo from '../repositories/Payment.repository.js';
import ParentOrder from '../models/ParentOrder.model.js';
import SellerOrder from '../models/SellerOrder.model.js';
import * as addressRepo from '../repositories/Address.repository.js';
import * as cartRepo from '../repositories/Cart.repository.js';
import * as productRepo from '../repositories/Product.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const checkout = async (userId, addressId) => {
  // 1. Validate address
  const address = await addressRepo.findById(addressId, userId);
  if (!address) throw new ApiError(404, 'Address not found');

  // 2. Get populated cart
  const cart = await cartRepo.findByUser(userId);
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  // 3. Validate stock and group by store
  const storeItemsMap = new Map();

for (const cartItem of cart.items) {
    const product = await productRepo.findPublicById(cartItem.product);
    if (!product) throw new ApiError(404, `Product ${cartItem.product} not found`);
    if (product.stock < cartItem.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    // Safely get the store ObjectId – populated or raw
    const storeId = (product.store?._id || product.store).toString();

    if (!storeItemsMap.has(storeId)) storeItemsMap.set(storeId, []);
    storeItemsMap.get(storeId).push({
      product: product._id,
      productNameSnapshot: product.name,
      unitPriceSnapshot: product.price,
      quantity: cartItem.quantity,
    });
}
  // 4. Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 5. Create ParentOrder
    const parentOrder = await ParentOrder.create([{
      customer: userId,
      shippingFullName: address.street,
      shippingPhone: '03001234567',
      shippingAddressLine1: address.street,
      shippingCity: address.city,
      shippingState: address.state,
      shippingPostalCode: address.postalCode,
      totalAmount: 0,
    }], { session });

    const createdParent = parentOrder[0];
    let totalAmount = 0;

    // 6. Create SellerOrders and deduct stock
    for (const [storeIdStr, items] of storeItemsMap.entries()) {
      const subTotal = items.reduce((sum, item) => sum + item.unitPriceSnapshot * item.quantity, 0);
      totalAmount += subTotal;

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

    // Update total
    createdParent.totalAmount = totalAmount;
    await createdParent.save({ session });

    // 7. Clear cart INSIDE transaction
    cart.items = [];
    await cart.save({ session });

    // 8. Commit
    await session.commitTransaction();
    session.endSession();

    // Return populated order
    const populatedOrder = await ParentOrder.findById(createdParent._id)
      .populate({ path: 'sellerOrders', select: 'store subTotal status items' })
      .lean();

    return populatedOrder;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Checkout transaction failed:', error);   // 🔍 this will show the exact error
    throw error;
  }
};
// Add this to the existing order.service.js (after the imports)

export const prepareOrder = async (userId, addressId, session) => {
  // 1. Validate address
  const address = await addressRepo.findById(addressId, userId);
  if (!address) throw new ApiError(404, 'Address not found');

  // 2. Load cart
  const cart = await cartRepo.findByUser(userId);
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  // 3. Validate stock & group by store (no deduction)
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

  // 4. Create ParentOrder – use actual address fields
  const parentOrder = await ParentOrder.create([{
    customer: userId,
    shippingFullName: address.fullName || address.street,      // fallback if no fullName
    shippingPhone: address.phoneNumber || '03001234567',       // fallback
    shippingAddressLine1: address.street,                       // your Address uses "street"
    shippingAddressLine2: address.addressLine2 || '',
    shippingCity: address.city,
    shippingState: address.state || '',
    shippingPostalCode: address.postalCode || '',
    totalAmount: 0,
  }], { session });

  const createdParent = parentOrder[0];
  let totalAmount = 0;

  // 5. Create SellerOrders
  for (const [storeIdStr, items] of storeItemsMap.entries()) {
    const subTotal = items.reduce((sum, item) => sum + item.unitPriceSnapshot * item.quantity, 0);
    totalAmount += subTotal;
    await SellerOrder.create([{
      parentOrder: createdParent._id,
      store: storeIdStr,
      subTotal,
      items,
    }], { session });
  }

  // 6. Update ParentOrder total
  createdParent.totalAmount = totalAmount;
  await createdParent.save({ session });

  return { parentOrder: createdParent, cart };
};

export const cancelOrder = async (orderId, userId) => {
  const parentOrder = await orderRepo.findByIdForMutation(orderId, userId);
  if (!parentOrder) throw new ApiError(404, 'Order not found');

  // ---------- Existing Pending path (COD / unpaid / no refund needed) ----------
  if (parentOrder.orderStatus === 'Pending') {
    await orderRepo.updateStatus(orderId, 'Cancelled');

    const sellerOrders = await orderRepo.findAllSellerOrdersByParentOrder(orderId);
    for (const so of sellerOrders) {
      await orderRepo.updateSellerOrderStatus(so._id, 'Cancelled');
    }

    return parentOrder;
  }

  // ---------- New Stripe Processing path with automatic refund ----------
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
      // 1. Refund via Stripe
      try {
        await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
      } catch (stripeError) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(502, 'Refund could not be processed, please try again or contact support');
      }

      // 2. Mark payment as Refunded
      payment.status = 'Refunded';
      await payment.save({ session });

      // 3. Manual PaymentTransaction record (simplified Phase 1 synthetic event ID)
      await PaymentTransaction.create([{
        payment: payment._id,
        type: 'refund',
        status: 'success',
        amount: payment.amount,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        stripeEventId: `manual-refund-${payment._id}-${Date.now()}`,
      }], { session });

      // 4. Restore stock
      for (const so of sellerOrders) {
        for (const item of so.items || []) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
      }

      // 5. Cancel parent order and seller orders
      await orderRepo.updateStatus(orderId, 'Cancelled');
      for (const so of sellerOrders) {
        so.status = 'Cancelled';
        await so.save({ session });
      }

      await session.commitTransaction();
      session.endSession();
      return parentOrder;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Any other status – not cancellable
  throw new ApiError(400, 'Only pending orders can be cancelled');
};
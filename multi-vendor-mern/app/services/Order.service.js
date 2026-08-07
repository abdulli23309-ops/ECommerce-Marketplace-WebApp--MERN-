import mongoose from 'mongoose';
import ParentOrder from '../models/ParentOrder.model.js';
import SellerOrder from '../models/SellerOrder.model.js';
import * as addressRepo from '../repositories/Address.repository.js';
import * as cartRepo from '../repositories/Cart.repository.js';
import * as productRepo from '../repositories/Product.repository.js';
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
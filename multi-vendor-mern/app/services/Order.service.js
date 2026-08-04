import mongoose from 'mongoose';
import ParentOrder from '../models/ParentOrder.model.js';
import SellerOrder from '../models/SellerOrder.model.js';
import * as addressRepo from '../repositories/Address.repository.js';
import * as cartRepo from '../repositories/Cart.repository.js';
import * as productRepo from '../repositories/Product.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const checkout = async (userId, addressId) => {
  // 1. Validate address ownership
  const address = await addressRepo.findById(addressId, userId);
  if (!address) throw new ApiError(404, 'Address not found');

  // 2. Get user's cart
  const cart = await cartRepo.findByUser(userId);
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  // 3. Validate stock and prepare items grouped by store
  const storeItemsMap = new Map(); // key: storeId (string), value: items array

  for (const cartItem of cart.items) {
    const product = await productRepo.findPublicById(cartItem.product);
    if (!product) throw new ApiError(404, `Product ${cartItem.product} not found`);
    if (product.stock < cartItem.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    const storeId = product.store.toString();
    if (!storeItemsMap.has(storeId)) {
      storeItemsMap.set(storeId, []);
    }
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
    const parentOrder = await ParentOrder.create(
      [
        {
          customer: userId,
          shippingFullName: `${address.street}`,
          shippingPhone: '03001234567', // you can later extend the address model to include phone
          shippingAddressLine1: address.street,
          shippingCity: address.city,
          shippingState: address.state,
          shippingPostalCode: address.postalCode,
          totalAmount: 0, // will calculate
        },
      ],
      { session }
    );
    const createdParent = parentOrder[0];
    let totalAmount = 0;

    // 6. Create SellerOrders and deduct stock
    for (const [storeIdStr, items] of storeItemsMap.entries()) {
      const subTotal = items.reduce(
        (sum, item) => sum + item.unitPriceSnapshot * item.quantity,
        0
      );
      totalAmount += subTotal;

      await SellerOrder.create(
        [
          {
            parentOrder: createdParent._id,
            store: storeIdStr,
            subTotal,
            items,
          },
        ],
        { session }
      );

      // Deduct stock for each product in this store
      for (const item of items) {
        await productRepo.deductStock(item.product, item.quantity, session);
      }
    }

    // Update total amount on parent order
    createdParent.totalAmount = totalAmount;
    await createdParent.save({ session });

    // 7. Clear cart
    await cartRepo.clearCart(userId);

    // 8. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Return populated order
    const populatedOrder = await ParentOrder.findById(createdParent._id)
      .populate({
        path: 'sellerOrders',
        select: 'store subTotal status items',
      })
      .lean();

    return populatedOrder;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
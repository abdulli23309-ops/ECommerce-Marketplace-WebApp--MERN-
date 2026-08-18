import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import Store from '../../app/models/Store.model.js';
import SellerProfile from '../../app/models/SellerProfile.model.js';
import Product from '../../app/models/Product.model.js';
import Cart from '../../app/models/Cart.model.js';
import ParentOrder from '../../app/models/ParentOrder.model.js';
import SellerOrder from '../../app/models/SellerOrder.model.js';
import Payment from '../../app/models/Payment.model.js';
import Notification from '../../app/models/Notification.model.js';

describe('Order cancellation notification (Priority 4)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('creates a notification after customer cancels a pending order', async () => {
    const customer = await User.create({
      name: 'Cancel Customer',
      email: `cancel-customer-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    const seller = await User.create({
      name: 'Cancel Seller',
      email: `cancel-seller-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const profile = await SellerProfile.create({
      user: seller._id,
      status: 'Approved',
      businessName: 'Cancel Store',
      taxId: '123',
      phone: '03001234567',
      address: 'Lahore',
    });

    const store = await Store.create({
      sellerProfile: profile._id,
      name: 'Cancel Store',
      description: 'Cancel store',
      city: 'Lahore',
    });

    const product = await Product.create({
      name: 'Cancel Product',
      description: 'Cancel product',
      price: 100,
      stock: 10,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    const parentOrder = await ParentOrder.create({
      customer: customer._id,
      orderStatus: 'Pending',
      shippingFullName: 'Cancel Customer',
      shippingPhone: '03451234567',
      shippingAddressLine1: 'Main Street',
      shippingCity: 'Lahore',
      shippingState: 'Punjab',
      shippingPostalCode: '54000',
      totalAmount: 100,
    });

    const sellerOrder = await SellerOrder.create({
      parentOrder: parentOrder._id,
      store: store._id,
      subTotal: 100,
      status: 'Pending',
      items: [
        {
          product: product._id,
          productNameSnapshot: 'Cancel Product',
          unitPriceSnapshot: 100,
          quantity: 1,
        },
      ],
    });

    await Payment.create({
      parentOrder: parentOrder._id,
      amount: 100,
      method: 'CashOnDelivery',
      status: 'Pending',
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .put(`/api/v1/orders/${parentOrder._id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    const notifications = await Notification.find({
      recipient: customer._id,
      type: 'order',
    });

    expect(notifications.length).toBe(1);
    expect(notifications[0].title).toBe('Order Cancelled');
  });
});
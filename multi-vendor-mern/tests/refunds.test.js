import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';
import Product from '../app/models/Product.model.js';
import ParentOrder from '../app/models/ParentOrder.model.js';
import SellerOrder from '../app/models/SellerOrder.model.js';
import Payment from '../app/models/Payment.model.js';
import ReturnRequest from '../app/models/Return.model.js';

const seedRefundData = async () => {
  const customer = await User.create({
    name: 'Refund Customer',
    email: `refund-customer-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Customer',
  });

  const seller = await User.create({
    name: 'Refund Seller',
    email: `refund-seller-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Seller',
  });

  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Refund Store',
    taxId: '123',
    phone: '03001234567',
    address: 'Refund Address',
  });

  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Refund Store',
    description: 'Refund store',
    city: 'Lahore',
  });

  const product = await Product.create({
    name: 'Refund Product',
    description: 'Product description',
    price: 750,
    stock: 10,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
  });

  const parentOrder = await ParentOrder.create({
    customer: customer._id,
    orderStatus: 'Delivered',
    shippingFullName: 'Refund Customer',
    shippingPhone: '03451234567',
    shippingAddressLine1: 'Main Street',
    shippingCity: 'Lahore',
    shippingState: 'Punjab',
    shippingPostalCode: '54000',
    totalAmount: 750,
  });

  const sellerOrder = await SellerOrder.create({
    parentOrder: parentOrder._id,
    store: store._id,
    subTotal: 750,
    status: 'Delivered',
    items: [
      {
        product: product._id,
        productNameSnapshot: 'Refund Product',
        unitPriceSnapshot: 750,
        quantity: 1,
      },
    ],
  });

  await Payment.create({
    parentOrder: parentOrder._id,
    amount: 750,
    method: 'CashOnDelivery',
    status: 'Completed',
  });

  const returnRequest = await ReturnRequest.create({
    customer: customer._id,
    product: product._id,
    sellerOrder: sellerOrder._id,
    reason: 'Item is defective/broken',
    description: 'Broken',
    images: [],
    status: 'SELLER_RECEIVED',
  });

  return { customer, returnRequest };
};

describe('Refund API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('rejects refund request for non-admin user', async () => {
    const { customer, returnRequest } = await seedRefundData();

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/refunds')
      .set('Authorization', `Bearer ${token}`)
      .send({ returnRequestId: returnRequest._id.toString() })
      .expect(403);

    expect(res.body.message).toContain('You must be a Admin');
  });

  it('rejects refund for return not in eligible state', async () => {
    const { returnRequest } = await seedRefundData();

    await ReturnRequest.updateOne(
      { _id: returnRequest._id },
      { status: 'PENDING_ADMIN_REVIEW' }
    );

    const admin = await User.create({
      name: 'Test Admin',
      email: `admin-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Admin',
    });

    const token = generateTestToken({
      sub: admin._id.toString(),
      roles: ['Admin'],
    });

    const res = await request(app)
      .post('/api/v1/refunds')
      .set('Authorization', `Bearer ${token}`)
      .send({ returnRequestId: returnRequest._id.toString() })
      .expect(400);

    expect(res.body.message).toContain('Return is not ready for refund');
  });

  it('calculates single-item refund amount correctly without refunding other sellers in multi-seller order', async () => {
    // Multi-seller scenario:
    // Seller A item: PKR 89,999.99 (Quantity 1)
    // Seller B item: PKR 467,842.00 (Quantity 1)
    // Total ParentOrder amount: PKR 557,841.99

    const customer = await User.create({
      name: 'Customer Multi',
      email: `customer-multi-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    const sellerA = await User.create({
      name: 'Seller A',
      email: `seller-a-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const profileA = await SellerProfile.create({
      user: sellerA._id,
      status: 'Approved',
      businessName: 'Store A',
      taxId: 'tax-a',
      phone: '03001111111',
      address: 'Address A',
    });

    const storeA = await Store.create({
      sellerProfile: profileA._id,
      name: 'Store A',
      city: 'Lahore',
    });

    const productA = await Product.create({
      name: 'Product A (Watch)',
      price: 89999.99,
      stock: 5,
      store: storeA._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    const sellerB = await User.create({
      name: 'Seller B',
      email: `seller-b-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const profileB = await SellerProfile.create({
      user: sellerB._id,
      status: 'Approved',
      businessName: 'Store B',
      taxId: 'tax-b',
      phone: '03002222222',
      address: 'Address B',
    });

    const storeB = await Store.create({
      sellerProfile: profileB._id,
      name: 'Store B',
      city: 'Karachi',
    });

    const productB = await Product.create({
      name: 'Product B (Laptop)',
      price: 467842.00,
      stock: 3,
      store: storeB._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    const parentOrder = await ParentOrder.create({
      customer: customer._id,
      orderStatus: 'Delivered',
      shippingFullName: 'Customer Multi',
      shippingPhone: '03009999999',
      shippingAddressLine1: 'Street 1',
      shippingCity: 'Lahore',
      totalAmount: 557841.99,
    });

    const sellerOrderA = await SellerOrder.create({
      parentOrder: parentOrder._id,
      store: storeA._id,
      subTotal: 89999.99,
      status: 'Delivered',
      items: [
        {
          product: productA._id,
          productNameSnapshot: 'Product A (Watch)',
          unitPriceSnapshot: 89999.99,
          quantity: 1,
        },
      ],
    });

    await SellerOrder.create({
      parentOrder: parentOrder._id,
      store: storeB._id,
      subTotal: 467842.00,
      status: 'Delivered',
      items: [
        {
          product: productB._id,
          productNameSnapshot: 'Product B (Laptop)',
          unitPriceSnapshot: 467842.00,
          quantity: 1,
        },
      ],
    });

    await Payment.create({
      parentOrder: parentOrder._id,
      amount: 557841.99,
      method: 'CashOnDelivery',
      status: 'Completed',
    });

    const returnRequest = await ReturnRequest.create({
      customer: customer._id,
      product: productA._id,
      sellerOrder: sellerOrderA._id,
      reason: 'Color does not match',
      quantity: 1,
      refundAmount: 89999.99,
      status: 'SELLER_RECEIVED',
    });

    const admin = await User.create({
      name: 'Super Admin',
      email: `admin-multi-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Admin',
    });

    const token = generateTestToken({
      sub: admin._id.toString(),
      roles: ['Admin'],
    });

    const res = await request(app)
      .post('/api/v1/refunds')
      .set('Authorization', `Bearer ${token}`)
      .send({ returnRequestId: returnRequest._id.toString() })
      .expect(201);

    // Assert the refund amount is strictly 89999.99 and NOT the combined multi-seller total 557841.99
    expect(res.body.data.amount).toBe(89999.99);
    expect(res.body.data.amount).not.toBe(557841.99);

    // Verify stock restoration for product A only (stock 5 -> 6)
    const updatedProductA = await Product.findById(productA._id);
    expect(updatedProductA.stock).toBe(6);

    const updatedProductB = await Product.findById(productB._id);
    expect(updatedProductB.stock).toBe(3); // Unchanged

    // Verify return request status transition
    const updatedReturn = await ReturnRequest.findById(returnRequest._id);
    expect(updatedReturn.status).toBe('INSPECTED_AND_REFUNDED');
  });

  it('calculates refund using unitPriceSnapshot * quantity if refundAmount is null on return request', async () => {
    const { customer, returnRequest } = await seedRefundData();

    // Clear refundAmount to test fallback calculation
    await ReturnRequest.updateOne(
      { _id: returnRequest._id },
      { refundAmount: null, quantity: 1 }
    );

    const admin = await User.create({
      name: 'Admin Fallback',
      email: `admin-fallback-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Admin',
    });

    const token = generateTestToken({
      sub: admin._id.toString(),
      roles: ['Admin'],
    });

    const res = await request(app)
      .post('/api/v1/refunds')
      .set('Authorization', `Bearer ${token}`)
      .send({ returnRequestId: returnRequest._id.toString() })
      .expect(201);

    // Seed data product price is 750 with qty 1
    expect(res.body.data.amount).toBe(750);
  });
});
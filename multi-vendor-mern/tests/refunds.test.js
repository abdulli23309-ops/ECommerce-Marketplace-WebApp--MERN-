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
});
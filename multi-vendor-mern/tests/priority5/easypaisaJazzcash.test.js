import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import SellerProfile from '../../app/models/SellerProfile.model.js';
import Store from '../../app/models/Store.model.js';
import Product from '../../app/models/Product.model.js';
import Cart from '../../app/models/Cart.model.js';
import Address from '../../app/models/Address.model.js';
import Payment from '../../app/models/Payment.model.js';
import ParentOrder from '../../app/models/ParentOrder.model.js';
import SellerOrder from '../../app/models/SellerOrder.model.js';

const seedSandboxPaymentData = async () => {
  const customer = await User.create({
    name: 'Sandbox Customer',
    email: `sandbox-customer-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Customer',
    emailVerified: true,
  });

  const seller = await User.create({
    name: 'Sandbox Seller',
    email: `sandbox-seller-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Seller',
  });

  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Sandbox Store',
    taxId: '123',
    phone: '03001234567',
    address: 'Lahore',
  });

  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Sandbox Store',
    description: 'Sandbox store',
    city: 'Lahore',
  });

  const product = await Product.create({
    name: 'Sandbox Product',
    description: 'Sandbox product',
    price: 500,
    stock: 10,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
    freeDelivery: true,
  });

  const address = await Address.create({
    user: customer._id,
    fullName: 'Sandbox Customer',
    phoneNumber: '03451234567',
    street: 'Street',
    city: 'Lahore',
    state: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
  });

  await Cart.create({
    user: customer._id,
    items: [{ product: product._id, quantity: 1, price: product.price }],
  });

  const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

  return { addressId: address._id.toString(), token, customer };
};

describe('Priority 5 — EasyPaisa and JazzCash Sandbox Payments', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('creates an EasyPaisa sandbox payment and marks it completed', async () => {
    const { addressId, token } = await seedSandboxPaymentData();

    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'EasyPaisa', mobileAccount: '03451234567' })
      .expect(200);

    expect(res.body.data.payment.method).toBe('EasyPaisa');
    expect(res.body.data.payment.status).toBe('Completed');

    const payment = await Payment.findById(res.body.data.payment._id);
    expect(payment.status).toBe('Completed');
    expect(payment.transactionId).toMatch(/^EP-TEST-/);

    // A settled wallet payment must advance the order into fulfilment so the
    // customer sees "Processing" (not "Pending") and the seller can act on it.
    const parentOrder = await ParentOrder.findById(res.body.data.order._id).lean();
    expect(parentOrder.orderStatus).toBe('Processing');

    const sellerOrders = await SellerOrder.find({ parentOrder: res.body.data.order._id }).lean();
    expect(sellerOrders.length).toBeGreaterThan(0);
    expect(sellerOrders.every((so) => so.status === 'Processing')).toBe(true);
  });

  it('creates a JazzCash sandbox payment and marks it completed', async () => {
    const { addressId, token } = await seedSandboxPaymentData();

    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'JazzCash', mobileAccount: '03001234567' })
      .expect(200);

    expect(res.body.data.payment.method).toBe('JazzCash');
    expect(res.body.data.payment.status).toBe('Completed');

    const payment = await Payment.findById(res.body.data.payment._id);
    expect(payment.status).toBe('Completed');
    expect(payment.transactionId).toMatch(/^JC-TEST-/);

    // Same fulfilment advancement for JazzCash: parent + seller orders Processing.
    const parentOrder = await ParentOrder.findById(res.body.data.order._id).lean();
    expect(parentOrder.orderStatus).toBe('Processing');

    const sellerOrders = await SellerOrder.find({ parentOrder: res.body.data.order._id }).lean();
    expect(sellerOrders.length).toBeGreaterThan(0);
    expect(sellerOrders.every((so) => so.status === 'Processing')).toBe(true);
  });

  it('does not advance the order to Processing when a wallet payment fails', async () => {
    const { addressId, token } = await seedSandboxPaymentData();

    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'EasyPaisa', mobileAccount: '03009999999' })
      .expect(400);

    expect(res.body.message).toContain('payment failed');

    // A failed wallet order must never be advanced to Processing — it is
    // cancelled, its payment is Failed, and its seller orders stay out of the
    // Processing pipeline (so they remain hidden from the seller).
    const parentOrder = await ParentOrder.findOne().sort({ createdAt: -1 }).lean();
    expect(parentOrder.orderStatus).toBe('Cancelled');
    expect(parentOrder.orderStatus).not.toBe('Processing');

    const payment = await Payment.findOne({ parentOrder: parentOrder._id }).lean();
    expect(payment.status).toBe('Failed');

    const sellerOrders = await SellerOrder.find({ parentOrder: parentOrder._id }).lean();
    expect(sellerOrders.every((so) => so.status !== 'Processing')).toBe(true);
  });

  it('rejects unsupported payment method', async () => {
    const { addressId, token } = await seedSandboxPaymentData();

    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'Bitcoin' })
      .expect(400);

    expect(res.body.message).toContain('Unsupported payment method');
  });
});
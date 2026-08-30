import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import Address from '../app/models/Address.model.js';
import Store from '../app/models/Store.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Product from '../app/models/Product.model.js';
import Cart from '../app/models/Cart.model.js';
import Coupon from '../app/models/Coupon.model.js';
import CouponUsage from '../app/models/CouponUsage.model.js';
import ParentOrder from '../app/models/ParentOrder.model.js';
import Payment from '../app/models/Payment.model.js';

const seedCheckoutData = async ({ stock = 10 } = {}) => {
  const customer = await User.create({
    name: 'Test Customer',
    email: `customer-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Customer',
    emailVerified: true,
  });

  const seller = await User.create({
    name: 'Test Seller',
    email: `seller-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Seller',
  });

  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Test Business',
    taxId: '1234567',
    phone: '03001234567',
    address: 'Test Address',
  });

  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Test Store',
    description: 'Test store',
    city: 'Lahore',
  });

  const product = await Product.create({
    name: 'Test Product',
    description: 'Test description',
    price: 100,
    stock,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
  });

  const address = await Address.create({
    user: customer._id,
    fullName: 'John Doe',
    phoneNumber: '03451234567',
    street: '123 Main St',
    city: 'Lahore',
    state: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
  });

  return { customer, address, product };
};

describe('Checkout API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('creates an order with real address fullName/phoneNumber', async () => {
    const { customer, address, product } = await seedCheckoutData({ stock: 10 });

    await Cart.create({
      user: customer._id,
      items: [{ product: product._id, price: 100, quantity: 2 }],
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
      .expect(200);

    expect(res.body.data.order.shippingFullName).toBe('John Doe');
    expect(res.body.data.order.shippingPhone).toBe('03451234567');
    expect(res.body.data.order.totalAmount).toBe(200);
  });

  it('rejects checkout when cart is empty', async () => {
    const { customer, address } = await seedCheckoutData({ stock: 10 });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
      .expect(400);

    expect(res.body.message).toBe('Cart is empty');
  });

  it('rejects checkout when stock is insufficient', async () => {
    const { customer, address, product } = await seedCheckoutData({ stock: 0 });

    await Cart.create({
      user: customer._id,
      items: [{ product: product._id, price: 100, quantity: 1 }],
    });

    const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
      .expect(400);

    expect(res.body.message).toBeTruthy();
  });

  // =========== M-007 REGRESSION TESTS ===========

  it('M-007: stock deduction via canonical COD flow uses atomic $gte guard', async () => {
    const { customer, address, product } = await seedCheckoutData({ stock: 5 });

    const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

    const addToCart = () =>
      Cart.updateOne(
        { user: customer._id },
        { $set: { items: [{ product: product._id, price: 100, quantity: 2 }] } },
        { upsert: true }
      );

    // First checkout should succeed (stock 5 -> 3)
    await addToCart();
    await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
      .expect(200);
    expect((await Product.findById(product._id).lean()).stock).toBe(3);

    // Second checkout should also succeed (stock 3 -> 1)
    await Cart.updateOne({ user: customer._id }, { $pull: { items: {} } });
    await addToCart();
    await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
      .expect(200);
    expect((await Product.findById(product._id).lean()).stock).toBe(1);

    // Third checkout should fail (stock 1 < needed 2)
    await Cart.updateOne({ user: customer._id }, { $pull: { items: {} } });
    await addToCart();
    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
      .expect(400);

    // Stock should remain 1 (atomic $gte guard prevents oversell)
    expect((await Product.findById(product._id).lean()).stock).toBe(1);

    // Two orders created (no oversell beyond stock)
    const orderCount = await ParentOrder.countDocuments({});
    expect(orderCount).toBe(2);
  });

  // =========== M-006 REGRESSION TESTS ===========

  describe('M-006 - payment-integrity / legacy checkout removal', () => {
    it('legacy POST /api/v1/orders/checkout is removed (404)', async () => {
      const { customer, address, product } = await seedCheckoutData();
      const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId: address._id.toString() })
        .expect(404);

      expect(res.body.message).toBe('Route not found');
    });

    it('M-006: canonical COD checkout creates a Payment record (no payment bypass)', async () => {
      const { customer, address, product } = await seedCheckoutData({ stock: 10 });
      const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

      await Cart.create({
        user: customer._id,
        items: [{ product: product._id, price: 100, quantity: 2 }],
      });

      const res = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
        .expect(200);

      // A Payment record must exist - proving every order goes through a payment path.
      const payments = await Payment.find({ parentOrder: res.body.data.order._id }).lean();
      expect(payments.length).toBe(1);
      expect(payments[0].method).toBe('CashOnDelivery');
      expect(payments[0].status).toBe('Pending');
    });

    it('M-006: canonical COD checkout with coupon creates CouponUsage record and increments usageCount', async () => {
      const { customer, address, product } = await seedCheckoutData({ stock: 10 });

      const coupon = await Coupon.create({
        code: 'TEST10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 50,
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
      });

      const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

      await Cart.create({
        user: customer._id,
        items: [{ product: product._id, price: 100, quantity: 2 }],
      });

      await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({
          addressId: address._id.toString(),
          paymentMethod: 'CashOnDelivery',
          couponCode: 'TEST10',
        })
        .expect(200);

      const updatedCoupon = await Coupon.findById(coupon._id).lean();
      expect(updatedCoupon.usageCount).toBe(1);

      const usageRecord = await CouponUsage.findOne({ coupon: coupon._id }).lean();
      expect(usageRecord).not.toBeNull();
      expect(usageRecord.user.toString()).toBe(customer._id.toString());
    });

    it('M-006: canonical COD checkout without coupon does not create CouponUsage record', async () => {
      const { customer, address, product } = await seedCheckoutData({ stock: 10 });

      const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

      await Cart.create({
        user: customer._id,
        items: [{ product: product._id, price: 100, quantity: 1 }],
      });

      await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
        .expect(200);

      const usageCount = await CouponUsage.countDocuments();
      expect(usageCount).toBe(0);
    });

    it('M-006: unauthenticated checkout attempt returns 401', async () => {
      const { address } = await seedCheckoutData();

      const res = await request(app)
        .post('/api/v1/payments/create-intent')
        .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
        .expect(401);

      expect(res.body.message).toBe('Authentication required');
    });
  });
});
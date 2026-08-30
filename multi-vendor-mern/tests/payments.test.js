import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';
import Product from '../app/models/Product.model.js';
import Cart from '../app/models/Cart.model.js';
import Address from '../app/models/Address.model.js';
import ParentOrder from '../app/models/ParentOrder.model.js';
import Payment from '../app/models/Payment.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'pay') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const createCustomer = async ({ emailVerified = true } = {}) => {
  const customer = await User.create({
    name: 'Pay Customer',
    email: uniqueEmail('customer'),
    password: 'password123',
    role: 'Customer',
    emailVerified,
  });
  const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });
  return { customer, token };
};

const seedStoreProduct = async ({ stock = 10 } = {}) => {
  const n = nextUid();
  const seller = await User.create({
    name: `Seller ${n}`,
    email: uniqueEmail('seller'),
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: `Business ${n}`,
    taxId: `TAX-${n}`,
    phone: '03001234567',
    address: 'Lahore',
  });
  const store = await Store.create({
    sellerProfile: profile._id,
    name: `Store ${n}`,
    description: 'A store',
    city: 'Lahore',
  });
  const product = await Product.create({
    name: `Product ${n}`,
    description: 'A product',
    price: 100,
    stock,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
  });
  return { store, product };
};

const createAddress = (customerId) =>
  Address.create({
    user: customerId,
    fullName: 'John Doe',
    phoneNumber: '03451234567',
    street: '123 Main St',
    city: 'Lahore',
    state: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
  });

const createParentOrder = (customerId, overrides = {}) =>
  ParentOrder.create({
    customer: customerId,
    orderStatus: 'Pending',
    shippingFullName: 'John Doe',
    shippingPhone: '03451234567',
    shippingAddressLine1: 'Main St',
    shippingCity: 'Lahore',
    totalAmount: 200,
    ...overrides,
  });

describe('Payments API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/v1/payments/create-intent (Cash on Delivery)', () => {
    it('places a COD order with a Pending payment, deducts stock, and clears the cart', async () => {
      const { customer, token } = await createCustomer();
      const { product } = await seedStoreProduct({ stock: 10 });
      const address = await createAddress(customer._id);
      await Cart.create({
        user: customer._id,
        items: [{ product: product._id, price: 100, quantity: 2 }],
      });

      const res = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
        .expect(200);

      expect(res.body.message).toBe('Payment intent created');
      expect(res.body.data.payment.method).toBe('CashOnDelivery');
      // COD is unpaid at checkout — the payment must stay Pending until the
      // cash is collected on delivery, never Completed.
      expect(res.body.data.payment.status).toBe('Pending');
      expect(res.body.data.clientSecret).toBeNull();

      const dbProduct = await Product.findById(product._id).lean();
      expect(dbProduct.stock).toBe(8); // 10 - 2

      const dbCart = await Cart.findOne({ user: customer._id }).lean();
      expect(dbCart.items).toHaveLength(0);

      // COD stays Pending at the order level — unlike a settled wallet/card
      // order, it must not auto-advance to Processing until cash is collected.
      const dbOrder = await ParentOrder.findById(res.body.data.order._id).lean();
      expect(dbOrder.orderStatus).toBe('Pending');
    });

    it('rejects a wallet payment with an invalid mobile number (400)', async () => {
      const { customer, token } = await createCustomer();
      const { product } = await seedStoreProduct();
      const address = await createAddress(customer._id);
      await Cart.create({
        user: customer._id,
        items: [{ product: product._id, price: 100, quantity: 1 }],
      });

      const res = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId: address._id.toString(), paymentMethod: 'EasyPaisa', mobileAccount: '123' })
        .expect(400);

      expect(res.body.message).toBe('Invalid mobile account number. Use 03XXXXXXXXX.');
    });

    it('blocks checkout for an unverified email (403)', async () => {
      const { customer, token } = await createCustomer({ emailVerified: false });
      const { product } = await seedStoreProduct();
      const address = await createAddress(customer._id);
      await Cart.create({
        user: customer._id,
        items: [{ product: product._id, price: 100, quantity: 1 }],
      });

      const res = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
        .expect(403);

      expect(res.body.message).toBe('Please verify your email before placing an order.');
    });

    it('rejects checkout with an empty cart (400)', async () => {
      const { customer, token } = await createCustomer();
      const address = await createAddress(customer._id);

      const res = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId: address._id.toString(), paymentMethod: 'CashOnDelivery' })
        .expect(400);

      expect(res.body.message).toBe('Cart is empty');
    });

    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app)
        .post('/api/v1/payments/create-intent')
        .send({ paymentMethod: 'CashOnDelivery' })
        .expect(401);
      expect(res.body.message).toBe('Authentication required');
    });
  });

  describe('POST /api/v1/payments (legacy dummy payment retired — M-004)', () => {
    it('no longer exposes the legacy dummy payment route (404)', async () => {
      const { customer, token } = await createCustomer();
      const order = await createParentOrder(customer._id, { totalAmount: 200 });

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ parentOrderId: order._id.toString() })
        .expect(404);

      expect(res.body.message).toBe('Route not found');
    });

    it('a customer can no longer mark their own pending order as paid', async () => {
      const { customer, token } = await createCustomer();
      const order = await createParentOrder(customer._id, { totalAmount: 200 });

      await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ parentOrderId: order._id.toString() })
        .expect(404);

      // The order was never advanced to Processing and no fake Completed
      // payment record exists — payment truth comes only from the real
      // processors (Stripe webhook / COD settlement).
      const dbOrder = await ParentOrder.findById(order._id).lean();
      expect(dbOrder.orderStatus).toBe('Pending');
      expect(await Payment.countDocuments({ parentOrder: order._id })).toBe(0);
    });
  });

  describe('GET /api/v1/payments/:parentOrderId (status)', () => {
    it('returns the payment status for an owned order', async () => {
      const { customer, token } = await createCustomer();
      const order = await createParentOrder(customer._id);
      await Payment.create({
        parentOrder: order._id,
        amount: order.totalAmount,
        method: 'CashOnDelivery',
        status: 'Pending',
      });

      const res = await request(app)
        .get(`/api/v1/payments/${order._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Payment status retrieved');
      expect(res.body.data.method).toBe('CashOnDelivery');
    });

    it('returns 404 when the order has no payment yet', async () => {
      const { customer, token } = await createCustomer();
      const order = await createParentOrder(customer._id);

      const res = await request(app)
        .get(`/api/v1/payments/${order._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Payment not found');
    });
  });

  describe('GET /api/v1/payments/order/:orderId', () => {
    it('returns the payment for an owned order', async () => {
      const { customer, token } = await createCustomer();
      const order = await createParentOrder(customer._id);
      await Payment.create({
        parentOrder: order._id,
        amount: order.totalAmount,
        method: 'CashOnDelivery',
        status: 'Pending',
      });

      const res = await request(app)
        .get(`/api/v1/payments/order/${order._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Payment retrieved');
      expect(res.body.data.method).toBe('CashOnDelivery');
    });
  });
});

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
import ParentOrder from '../app/models/ParentOrder.model.js';
import SellerOrder from '../app/models/SellerOrder.model.js';
import Payment from '../app/models/Payment.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'order') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const createCustomer = async () => {
  const customer = await User.create({
    name: 'Order Customer',
    email: uniqueEmail('customer'),
    password: 'password123',
    role: 'Customer',
    emailVerified: true,
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

const createParentOrder = (customerId, overrides = {}) =>
  ParentOrder.create({
    customer: customerId,
    orderStatus: 'Pending',
    shippingFullName: 'John Doe',
    shippingPhone: '03451234567',
    shippingAddressLine1: 'Main St',
    shippingCity: 'Lahore',
    shippingState: 'Punjab',
    shippingPostalCode: '54000',
    totalAmount: 200,
    ...overrides,
  });

describe('Order lifecycle API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('authentication', () => {
    it('rejects unauthenticated access to order history with 401', async () => {
      const res = await request(app).get('/api/v1/orders').expect(401);
      expect(res.body.message).toBe('Authentication required');
    });
  });

  describe('GET /api/v1/orders/preview', () => {
    it('returns zeroed totals for an empty cart', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .get('/api/v1/orders/preview')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Order preview calculated');
      expect(res.body.data.subtotal).toBe(0);
      expect(res.body.data.total).toBe(0);
    });

    it('computes the subtotal and total from cart contents', async () => {
      const { customer, token } = await createCustomer();
      const { product } = await seedStoreProduct();
      await Cart.create({
        user: customer._id,
        items: [{ product: product._id, price: 100, quantity: 2 }],
      });

      const res = await request(app)
        .get('/api/v1/orders/preview')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.subtotal).toBe(200);
      expect(res.body.data.deliveryCharges).toBe(0);
      expect(res.body.data.total).toBe(200);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('returns only the authenticated customer orders, newest first', async () => {
      const { customer, token } = await createCustomer();
      const { customer: other } = await createCustomer();
      await createParentOrder(customer._id);
      await createParentOrder(customer._id);
      await createParentOrder(other._id); // must not appear

      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Orders retrieved');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBe(2);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('returns an owned order with payment info', async () => {
      const { customer, token } = await createCustomer();
      const order = await createParentOrder(customer._id);

      const res = await request(app)
        .get(`/api/v1/orders/${order._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Order retrieved');
      expect(res.body.data._id).toBe(order._id.toString());
      // Payment info is attached (null when no payment exists).
      expect(res.body.data).toHaveProperty('payment');
    });

    it('returns 404 for an order owned by another customer', async () => {
      const { customer } = await createCustomer();
      const { token: otherToken } = await createCustomer();
      const order = await createParentOrder(customer._id);

      const res = await request(app)
        .get(`/api/v1/orders/${order._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(res.body.message).toBe('Order not found');
    });

    it('returns 404 for a valid but unknown order id', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .get(`/api/v1/orders/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Order not found');
    });
  });

  describe('PUT /api/v1/orders/:id/cancel', () => {
    it('cancels a pending order', async () => {
      const { customer, token } = await createCustomer();
      const order = await createParentOrder(customer._id, { orderStatus: 'Pending' });

      const res = await request(app)
        .put(`/api/v1/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Order cancelled');

      const dbOrder = await ParentOrder.findById(order._id).lean();
      expect(dbOrder.orderStatus).toBe('Cancelled');
    });

    it('restocks products when cancelling a Cash-on-Delivery order', async () => {
      const { customer, token } = await createCustomer();
      const { store, product } = await seedStoreProduct({ stock: 5 });
      const order = await createParentOrder(customer._id, { orderStatus: 'Pending' });
      await SellerOrder.create({
        parentOrder: order._id,
        store: store._id,
        subTotal: 200,
        items: [
          {
            product: product._id,
            productNameSnapshot: product.name,
            unitPriceSnapshot: product.price,
            quantity: 2,
          },
        ],
      });
      await Payment.create({
        parentOrder: order._id,
        amount: 200,
        method: 'CashOnDelivery',
        status: 'Pending',
      });

      await request(app)
        .put(`/api/v1/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const dbProduct = await Product.findById(product._id).lean();
      expect(dbProduct.stock).toBe(7); // 5 + 2 restocked
    });

    it('rejects cancelling an order owned by another customer with 404', async () => {
      const { customer } = await createCustomer();
      const { token: otherToken } = await createCustomer();
      const order = await createParentOrder(customer._id, { orderStatus: 'Pending' });

      const res = await request(app)
        .put(`/api/v1/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(res.body.message).toBe('Order not found');
    });

    it('rejects cancelling a delivered order with 400', async () => {
      const { customer, token } = await createCustomer();
      const order = await createParentOrder(customer._id, { orderStatus: 'Delivered' });

      const res = await request(app)
        .put(`/api/v1/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body.message).toBe('Only pending orders can be cancelled');
    });

    it('returns 404 (Resource not found) for a malformed order id', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .put('/api/v1/orders/not-a-valid-id/cancel')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Resource not found');
    });
  });

  describe('GET /api/v1/orders/seller-orders/:id', () => {
    it('returns a seller order by id', async () => {
      const { customer } = await createCustomer();
      const { token } = await createCustomer();
      const { store, product } = await seedStoreProduct();
      const parent = await createParentOrder(customer._id);
      const sellerOrder = await SellerOrder.create({
        parentOrder: parent._id,
        store: store._id,
        subTotal: 100,
        items: [
          {
            product: product._id,
            productNameSnapshot: product.name,
            unitPriceSnapshot: product.price,
            quantity: 1,
          },
        ],
      });

      const res = await request(app)
        .get(`/api/v1/orders/seller-orders/${sellerOrder._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Seller order retrieved');
      expect(res.body.data._id).toBe(sellerOrder._id.toString());
    });

    it('returns 404 for an unknown seller order id', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .get(`/api/v1/orders/seller-orders/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Seller order not found');
    });
  });
});

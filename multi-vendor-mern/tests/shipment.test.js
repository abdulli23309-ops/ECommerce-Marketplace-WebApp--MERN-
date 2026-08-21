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
import Shipment from '../app/models/Shipment.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'ship') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const createCustomer = async () => {
  const customer = await User.create({
    name: 'Ship Customer',
    email: uniqueEmail('customer'),
    password: 'password123',
    role: 'Customer',
    emailVerified: true,
  });
  return customer;
};

// A seller with a profile, store, product, and a Seller-scoped token.
const seedSeller = async () => {
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
    stock: 10,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
  });
  const token = generateTestToken({ sub: seller._id.toString(), roles: ['Seller'] });
  return { seller, profile, store, product, token };
};

const createParentOrder = (customerId) =>
  ParentOrder.create({
    customer: customerId,
    orderStatus: 'Processing',
    shippingFullName: 'John Doe',
    shippingPhone: '03451234567',
    shippingAddressLine1: 'Main St',
    shippingCity: 'Lahore',
    totalAmount: 100,
  });

const createSellerOrder = (parentId, store, product) =>
  SellerOrder.create({
    parentOrder: parentId,
    store: store._id,
    subTotal: 100,
    status: 'Processing',
    items: [
      {
        product: product._id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: product.price,
        quantity: 1,
      },
    ],
  });

// Full context: a seller order owned by `seller`, tied to a customer's parent order.
const seedSellerOrder = async (sellerCtx) => {
  const customer = await createCustomer();
  const parent = await createParentOrder(customer._id);
  const sellerOrder = await createSellerOrder(parent._id, sellerCtx.store, sellerCtx.product);
  return { customer, parent, sellerOrder };
};

describe('Shipment API (seller)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/v1/shipments', () => {
    it('creates a shipment for the seller own order and moves it to Processing', async () => {
      const sellerCtx = await seedSeller();
      const { sellerOrder } = await seedSellerOrder(sellerCtx);

      const res = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .send({ sellerOrderId: sellerOrder._id.toString(), carrier: 'TCS' })
        .expect(201);

      expect(res.body.message).toBe('Shipment created');
      expect(res.body.data.status).toBe('Pending');

      const dbSellerOrder = await SellerOrder.findById(sellerOrder._id).lean();
      expect(dbSellerOrder.status).toBe('Processing');
    });

    it('returns 404 for an unknown seller order', async () => {
      const sellerCtx = await seedSeller();

      const res = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .send({ sellerOrderId: new mongoose.Types.ObjectId().toString() })
        .expect(404);

      expect(res.body.message).toBe('Seller order not found');
    });

    it('forbids a seller from shipping another seller order (403)', async () => {
      const owner = await seedSeller();
      const intruder = await seedSeller();
      const { sellerOrder } = await seedSellerOrder(owner);

      const res = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${intruder.token}`)
        .send({ sellerOrderId: sellerOrder._id.toString() })
        .expect(403);

      expect(res.body.message).toBe('You do not own this store');
    });

    it('rejects a duplicate shipment with 409', async () => {
      const sellerCtx = await seedSeller();
      const { sellerOrder } = await seedSellerOrder(sellerCtx);

      await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .send({ sellerOrderId: sellerOrder._id.toString() })
        .expect(201);

      const res = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .send({ sellerOrderId: sellerOrder._id.toString() })
        .expect(409);

      expect(res.body.message).toBe('Shipment already exists for this order');
    });

    it('rejects a non-seller (Customer) with 403', async () => {
      const customer = await createCustomer();
      const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

      const res = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send({ sellerOrderId: new mongoose.Types.ObjectId().toString() })
        .expect(403);

      expect(res.body.message).toBe('You must be a Seller');
    });

    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app).post('/api/v1/shipments').send({}).expect(401);
      expect(res.body.message).toBe('Authentication required');
    });
  });

  describe('GET /api/v1/shipments/:sellerOrderId', () => {
    it('returns the shipment for an owned seller order', async () => {
      const sellerCtx = await seedSeller();
      const { sellerOrder } = await seedSellerOrder(sellerCtx);
      await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .send({ sellerOrderId: sellerOrder._id.toString(), carrier: 'TCS' })
        .expect(201);

      const res = await request(app)
        .get(`/api/v1/shipments/${sellerOrder._id}`)
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .expect(200);

      expect(res.body.message).toBe('Shipment retrieved');
      expect(res.body.data.carrier).toBe('TCS');
    });

    it('returns 404 when no shipment exists for the seller order', async () => {
      const sellerCtx = await seedSeller();
      const { sellerOrder } = await seedSellerOrder(sellerCtx);

      const res = await request(app)
        .get(`/api/v1/shipments/${sellerOrder._id}`)
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .expect(404);

      expect(res.body.message).toBe('Shipment not found');
    });
  });

  describe('PUT /api/v1/shipments/:id', () => {
    it('updates carrier and tracking info', async () => {
      const sellerCtx = await seedSeller();
      const { sellerOrder } = await seedSellerOrder(sellerCtx);
      const createRes = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .send({ sellerOrderId: sellerOrder._id.toString() })
        .expect(201);
      const shipmentId = createRes.body.data._id;

      const res = await request(app)
        .put(`/api/v1/shipments/${shipmentId}`)
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .send({ carrier: 'Leopards', trackingNumber: 'TRK-123' })
        .expect(200);

      expect(res.body.message).toBe('Shipment updated');
      expect(res.body.data.carrier).toBe('Leopards');
      expect(res.body.data.trackingNumber).toBe('TRK-123');
    });
  });

  describe('PUT /api/v1/shipments/:id/status', () => {
    it('advances the shipment status', async () => {
      const sellerCtx = await seedSeller();
      const { sellerOrder } = await seedSellerOrder(sellerCtx);
      const createRes = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .send({ sellerOrderId: sellerOrder._id.toString() })
        .expect(201);
      const shipmentId = createRes.body.data._id;

      const res = await request(app)
        .put(`/api/v1/shipments/${shipmentId}/status`)
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .send({ status: 'Packed', note: 'Ready to ship' })
        .expect(200);

      expect(res.body.message).toBe('Shipment status updated');
      expect(res.body.data.status).toBe('Packed');

      const dbSellerOrder = await SellerOrder.findById(sellerOrder._id).lean();
      expect(dbSellerOrder.status).toBe('Packed');
    });

    it('returns 404 for an unknown shipment id', async () => {
      const sellerCtx = await seedSeller();

      const res = await request(app)
        .put(`/api/v1/shipments/${new mongoose.Types.ObjectId()}/status`)
        .set('Authorization', `Bearer ${sellerCtx.token}`)
        .send({ status: 'Packed' })
        .expect(404);

      expect(res.body.message).toBe('Shipment not found');
    });
  });
});

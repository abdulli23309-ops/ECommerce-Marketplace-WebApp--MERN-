import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';
import Product from '../app/models/Product.model.js';
import Category from '../app/models/Category.model.js';
import SubCategory from '../app/models/SubCategory.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'adminprod') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const adminToken = async () => {
  const admin = await User.create({
    name: 'Admin User',
    email: uniqueEmail('admin'),
    password: 'password123',
    role: 'Admin',
  });
  return generateTestToken({ sub: admin._id.toString(), roles: ['Admin'] });
};

const seedStore = async () => {
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
  return { seller, profile, store };
};

const seedCatalog = async () => {
  const n = nextUid();
  const category = await Category.create({ name: `Category ${n}` });
  const subCategory = await SubCategory.create({ name: `SubCategory ${n}`, category: category._id });
  return { category, subCategory };
};

const makeProduct = (store, category, subCategory, overrides = {}) =>
  Product.create({
    name: `Product ${nextUid()}`,
    description: 'A product',
    price: 100,
    stock: 10,
    store: store._id,
    category: category._id,
    subCategory: subCategory._id,
    status: 'PendingApproval',
    ...overrides,
  });

describe('Admin Products API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('GET /api/v1/admin/products', () => {
    it('lists all non-deleted products regardless of status', async () => {
      const token = await adminToken();
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      await makeProduct(store, category, subCategory, { status: 'PendingApproval' });
      await makeProduct(store, category, subCategory, { status: 'Approved' });

      const res = await request(app)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Products retrieved');
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.total).toBe(2);
    });

    it('filters the admin listing by status', async () => {
      const token = await adminToken();
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      await makeProduct(store, category, subCategory, { status: 'PendingApproval' });
      await makeProduct(store, category, subCategory, { status: 'Approved' });

      const res = await request(app)
        .get('/api/v1/admin/products?status=PendingApproval')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.products[0].status).toBe('PendingApproval');
    });
  });

  describe('GET /api/v1/admin/products/stats', () => {
    it('returns aggregate product statistics', async () => {
      const token = await adminToken();
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      await makeProduct(store, category, subCategory, { status: 'PendingApproval' });
      await makeProduct(store, category, subCategory, { status: 'Approved' });

      const res = await request(app)
        .get('/api/v1/admin/products/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Product statistics retrieved');
      expect(res.body.data.totalProducts).toBe(2);
      expect(res.body.data.pendingApproval).toBe(1);
    });
  });

  describe('GET /api/v1/admin/products/:id', () => {
    it('returns a single product for the admin', async () => {
      const token = await adminToken();
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory, { name: 'Admin View' });

      const res = await request(app)
        .get(`/api/v1/admin/products/${product._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Product retrieved');
      expect(res.body.data.name).toBe('Admin View');
    });
  });

  describe('PUT /api/v1/admin/products/:id/status', () => {
    it('approves a pending product and stamps approvedAt', async () => {
      const token = await adminToken();
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory, { status: 'PendingApproval' });

      const res = await request(app)
        .put(`/api/v1/admin/products/${product._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Approved' })
        .expect(200);

      expect(res.body.message).toBe('Product status updated');
      expect(res.body.data.status).toBe('Approved');

      const dbProduct = await Product.findById(product._id).lean();
      expect(dbProduct.status).toBe('Approved');
      expect(dbProduct.approvedAt).not.toBeNull();
    });

    it('rejects a product and records the rejection reason', async () => {
      const token = await adminToken();
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory, { status: 'PendingApproval' });

      const res = await request(app)
        .put(`/api/v1/admin/products/${product._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Rejected', reason: 'Prohibited item' })
        .expect(200);

      expect(res.body.data.status).toBe('Rejected');

      const dbProduct = await Product.findById(product._id).lean();
      expect(dbProduct.status).toBe('Rejected');
      expect(dbProduct.rejectionReason).toBe('Prohibited item');
    });

    it('returns 404 (Resource not found) for a malformed product id', async () => {
      const token = await adminToken();

      const res = await request(app)
        .put('/api/v1/admin/products/not-a-valid-id/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Approved' })
        .expect(404);

      expect(res.body.message).toBe('Resource not found');
    });
  });

  describe('authorization', () => {
    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app).get('/api/v1/admin/products').expect(401);
      expect(res.body.message).toBe('Authentication required');
    });

    it('rejects a non-admin (Seller) with 403', async () => {
      const { seller } = await seedStore();
      const token = generateTestToken({ sub: seller._id.toString(), roles: ['Seller'] });

      const res = await request(app)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.message).toBe('You must be a Admin');
    });
  });
});

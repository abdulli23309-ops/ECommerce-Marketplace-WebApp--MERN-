import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';
import Product from '../app/models/Product.model.js';
import Category from '../app/models/Category.model.js';
import SubCategory from '../app/models/SubCategory.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'pub') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

// Approved seller + active store => products are eligible for public listing.
const seedStore = async ({ profileStatus = 'Approved', storeActive = true } = {}) => {
  const n = nextUid();
  const seller = await User.create({
    name: `Seller ${n}`,
    email: uniqueEmail('seller'),
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: profileStatus,
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
    isActive: storeActive,
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
    status: 'Approved',
    ...overrides,
  });

describe('Public Products API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('GET /api/v1/products', () => {
    it('lists approved products from approved sellers without authentication', async () => {
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      await makeProduct(store, category, subCategory, { name: 'Visible One' });
      await makeProduct(store, category, subCategory, { name: 'Visible Two' });

      const res = await request(app).get('/api/v1/products').expect(200);

      expect(res.body.message).toBe('Products retrieved');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(typeof res.body.data.page).toBe('number');
      expect(typeof res.body.data.totalPages).toBe('number');
    });

    it('hides products that are not Approved', async () => {
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      await makeProduct(store, category, subCategory, { name: 'Approved Prod' });
      await makeProduct(store, category, subCategory, { name: 'Pending Prod', status: 'PendingApproval' });

      const res = await request(app).get('/api/v1/products').expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('Approved Prod');
    });

    it('hides products whose seller is not approved', async () => {
      const approved = await seedStore();
      const pending = await seedStore({ profileStatus: 'Pending' });
      const { category, subCategory } = await seedCatalog();
      await makeProduct(approved.store, category, subCategory, { name: 'From Approved Seller' });
      await makeProduct(pending.store, category, subCategory, { name: 'From Pending Seller' });

      const res = await request(app).get('/api/v1/products').expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('From Approved Seller');
    });

    it('filters products by a search term', async () => {
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      await makeProduct(store, category, subCategory, { name: 'Sapphire Ring' });
      await makeProduct(store, category, subCategory, { name: 'Copper Kettle' });

      const res = await request(app).get('/api/v1/products?search=Sapphire').expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('Sapphire Ring');
    });

    it('filters products by a price range', async () => {
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      await makeProduct(store, category, subCategory, { name: 'Cheap', price: 20 });
      await makeProduct(store, category, subCategory, { name: 'Expensive', price: 500 });

      const res = await request(app).get('/api/v1/products?minPrice=100&maxPrice=1000').expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('Expensive');
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('returns an approved product with its store populated', async () => {
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory, { name: 'Detail Product' });

      const res = await request(app).get(`/api/v1/products/${product._id}`).expect(200);

      expect(res.body.message).toBe('Product retrieved');
      expect(res.body.data.name).toBe('Detail Product');
      expect(res.body.data.store.name).toBe(store.name);
    });

    it('returns 404 for a product that is not approved', async () => {
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory, { status: 'PendingApproval' });

      const res = await request(app).get(`/api/v1/products/${product._id}`).expect(404);
      expect(res.body.message).toBe('Product not found');
    });

    it('returns 404 for a valid but unknown product id', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${new mongoose.Types.ObjectId()}`)
        .expect(404);
      expect(res.body.message).toBe('Product not found');
    });

    it('returns 404 (Resource not found) for a malformed product id', async () => {
      const res = await request(app).get('/api/v1/products/not-a-valid-id').expect(404);
      expect(res.body.message).toBe('Resource not found');
    });
  });

  describe('GET /api/v1/products/suggestions', () => {
    it('returns matching product suggestions for a prefix query', async () => {
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      await makeProduct(store, category, subCategory, { name: 'Sapphire Phone' });
      await makeProduct(store, category, subCategory, { name: 'Copper Pot' });

      const res = await request(app).get('/api/v1/products/suggestions?q=Sapp').expect(200);

      expect(res.body.message).toBe('Suggestions retrieved');
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.products.some((p) => p.name === 'Sapphire Phone')).toBe(true);
      expect(res.body.data.products.some((p) => p.name === 'Copper Pot')).toBe(false);
    });

    it('returns empty suggestion buckets for a query shorter than two characters', async () => {
      const { store } = await seedStore();
      const { category, subCategory } = await seedCatalog();
      await makeProduct(store, category, subCategory, { name: 'Sapphire Phone' });

      const res = await request(app).get('/api/v1/products/suggestions?q=S').expect(200);

      expect(res.body.data.products).toEqual([]);
      expect(res.body.data.categories).toEqual([]);
      expect(res.body.data.brands).toEqual([]);
    });
  });
});

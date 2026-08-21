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
const uniqueEmail = (prefix = 'seller') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const CREATE = ['Seller.Products.Create'];
const EDIT = ['Seller.Products.Edit'];
const DELETE = ['Seller.Products.Delete'];

const sellerToken = (seller, permissions = []) =>
  generateTestToken({ sub: seller._id.toString(), roles: ['Seller'], permissions });

// Creates a seller user with an (optionally approved) profile and a store.
const seedSeller = async ({ status = 'Approved' } = {}) => {
  const n = nextUid();
  const seller = await User.create({
    name: `Seller ${n}`,
    email: uniqueEmail(),
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status,
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

// Real, active category + subcategory so createProduct's availability checks pass.
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

describe('Seller Products API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/v1/seller/products', () => {
    it('creates a product for an approved seller with the Create permission', async () => {
      const { seller, store } = await seedSeller();
      const { category, subCategory } = await seedCatalog();

      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${sellerToken(seller, CREATE)}`)
        .send({
          name: 'Fresh Product',
          description: 'Nice',
          price: 149.99,
          stock: 7,
          category: category._id.toString(),
          subCategory: subCategory._id.toString(),
        })
        .expect(201);

      expect(res.body.message).toBe('Product created');
      expect(res.body.data.name).toBe('Fresh Product');
      expect(res.body.data.store).toBe(store._id.toString());
      // No status supplied → defaults to PendingApproval (not auto-approved).
      expect(res.body.data.status).toBe('PendingApproval');

      const dbProduct = await Product.findById(res.body.data._id).lean();
      expect(dbProduct.price).toBe(149.99);
    });

    it('rejects creation without the Seller.Products.Create permission (403)', async () => {
      const { seller } = await seedSeller();
      const { category, subCategory } = await seedCatalog();

      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${sellerToken(seller, [])}`)
        .send({
          name: 'Blocked Product',
          price: 10,
          stock: 1,
          category: category._id.toString(),
          subCategory: subCategory._id.toString(),
        })
        .expect(403);

      expect(res.body.message).toBe('Insufficient permissions');
    });

    it('rejects creation with a missing price (validation)', async () => {
      const { seller } = await seedSeller();
      const { category, subCategory } = await seedCatalog();

      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${sellerToken(seller, CREATE)}`)
        .send({
          name: 'No Price',
          stock: 1,
          category: category._id.toString(),
          subCategory: subCategory._id.toString(),
        })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'price')).toBe(true);
    });

    it('rejects creation when the category does not exist (400)', async () => {
      const { seller } = await seedSeller();
      const { subCategory } = await seedCatalog();

      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${sellerToken(seller, CREATE)}`)
        .send({
          name: 'Bad Category',
          price: 10,
          stock: 1,
          category: new mongoose.Types.ObjectId().toString(),
          subCategory: subCategory._id.toString(),
        })
        .expect(400);

      expect(res.body.message).toBe('Category is not available');
    });

    it('rejects creation when the subcategory does not exist (400)', async () => {
      const { seller } = await seedSeller();
      const { category } = await seedCatalog();

      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${sellerToken(seller, CREATE)}`)
        .send({
          name: 'Bad SubCategory',
          price: 10,
          stock: 1,
          category: category._id.toString(),
          subCategory: new mongoose.Types.ObjectId().toString(),
        })
        .expect(400);

      expect(res.body.message).toBe('Subcategory is not available');
    });

    it('rejects a duplicate product name within the same store (409)', async () => {
      // The unique guard is the {name, store} partial index — make sure it is built.
      await Product.syncIndexes();
      const { seller, store } = await seedSeller();
      const { category, subCategory } = await seedCatalog();

      await makeProduct(store, category, subCategory, { name: 'Dup Name', status: 'PendingApproval' });

      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${sellerToken(seller, CREATE)}`)
        .send({
          name: 'Dup Name',
          price: 10,
          stock: 1,
          category: category._id.toString(),
          subCategory: subCategory._id.toString(),
        })
        .expect(409);

      expect(res.body.message).toBe('A record with this value already exists');
    });

    it('rejects an unapproved seller with 403', async () => {
      const { seller } = await seedSeller({ status: 'Pending' });
      const { category, subCategory } = await seedCatalog();

      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${sellerToken(seller, CREATE)}`)
        .send({
          name: 'Pending Seller Product',
          price: 10,
          stock: 1,
          category: category._id.toString(),
          subCategory: subCategory._id.toString(),
        })
        .expect(403);

      expect(res.body.message).toBe('Your seller account is not approved');
    });
  });

  describe('GET /api/v1/seller/products', () => {
    it('lists only the seller own products', async () => {
      const { seller, store } = await seedSeller();
      const { category, subCategory } = await seedCatalog();
      await makeProduct(store, category, subCategory);
      await makeProduct(store, category, subCategory);

      const res = await request(app)
        .get('/api/v1/seller/products')
        .set('Authorization', `Bearer ${sellerToken(seller)}`)
        .expect(200);

      expect(res.body.message).toBe('Products retrieved');
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.total).toBe(2);
    });
  });

  describe('GET /api/v1/seller/products/:id', () => {
    it('returns 404 when reading a product owned by another seller', async () => {
      const { store } = await seedSeller();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory);

      const { seller: otherSeller } = await seedSeller();

      const res = await request(app)
        .get(`/api/v1/seller/products/${product._id}`)
        .set('Authorization', `Bearer ${sellerToken(otherSeller)}`)
        .expect(404);

      expect(res.body.message).toBe('Product not found');
    });
  });

  describe('PUT /api/v1/seller/products/:id', () => {
    it('updates an owned product', async () => {
      const { seller, store } = await seedSeller();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory, { price: 100 });

      const res = await request(app)
        .put(`/api/v1/seller/products/${product._id}`)
        .set('Authorization', `Bearer ${sellerToken(seller, EDIT)}`)
        .send({ price: 175 })
        .expect(200);

      expect(res.body.message).toBe('Product updated');
      expect(res.body.data.price).toBe(175);
    });

    it('ignores a seller-supplied status (cannot self-approve via update)', async () => {
      const { seller, store } = await seedSeller();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory, { status: 'PendingApproval' });

      const res = await request(app)
        .put(`/api/v1/seller/products/${product._id}`)
        .set('Authorization', `Bearer ${sellerToken(seller, EDIT)}`)
        .send({ status: 'Approved', price: 120 })
        .expect(200);

      // status is stripped server-side; it stays PendingApproval.
      expect(res.body.data.status).toBe('PendingApproval');
      expect(res.body.data.price).toBe(120);
    });

    it('returns 404 when updating another seller product', async () => {
      const { store } = await seedSeller();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory);

      const { seller: otherSeller } = await seedSeller();

      const res = await request(app)
        .put(`/api/v1/seller/products/${product._id}`)
        .set('Authorization', `Bearer ${sellerToken(otherSeller, EDIT)}`)
        .send({ price: 5 })
        .expect(404);

      expect(res.body.message).toBe('Product not found');
    });

    it('returns 404 (Resource not found) for a malformed product id', async () => {
      const { seller } = await seedSeller();

      const res = await request(app)
        .put('/api/v1/seller/products/not-a-valid-id')
        .set('Authorization', `Bearer ${sellerToken(seller, EDIT)}`)
        .send({ price: 5 })
        .expect(404);

      expect(res.body.message).toBe('Resource not found');
    });
  });

  describe('DELETE /api/v1/seller/products/:id', () => {
    it('soft-deletes an owned product', async () => {
      const { seller, store } = await seedSeller();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory);

      const res = await request(app)
        .delete(`/api/v1/seller/products/${product._id}`)
        .set('Authorization', `Bearer ${sellerToken(seller, DELETE)}`)
        .expect(200);

      expect(res.body.message).toBe('Product deleted');
      expect(res.body.data).toBeNull();

      const dbProduct = await Product.findById(product._id).lean();
      expect(dbProduct.isDeleted).toBe(true);
    });

    it('rejects deletion without the Seller.Products.Delete permission (403)', async () => {
      const { seller, store } = await seedSeller();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory);

      const res = await request(app)
        .delete(`/api/v1/seller/products/${product._id}`)
        .set('Authorization', `Bearer ${sellerToken(seller, [])}`)
        .expect(403);

      expect(res.body.message).toBe('Insufficient permissions');
    });

    it('returns 404 when deleting another seller product', async () => {
      const { store } = await seedSeller();
      const { category, subCategory } = await seedCatalog();
      const product = await makeProduct(store, category, subCategory);

      const { seller: otherSeller } = await seedSeller();

      const res = await request(app)
        .delete(`/api/v1/seller/products/${product._id}`)
        .set('Authorization', `Bearer ${sellerToken(otherSeller, DELETE)}`)
        .expect(404);

      expect(res.body.message).toBe('Product not found');
    });
  });

  describe('role gate', () => {
    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app).get('/api/v1/seller/products').expect(401);
      expect(res.body.message).toBe('Authentication required');
    });

    it('rejects a non-seller (Customer) with 403', async () => {
      const customer = await User.create({
        name: 'Customer',
        email: uniqueEmail('customer'),
        password: 'password123',
        role: 'Customer',
      });
      const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

      const res = await request(app)
        .get('/api/v1/seller/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.message).toBe('You must be a Seller');
    });
  });
});

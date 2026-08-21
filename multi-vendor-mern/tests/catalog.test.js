import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import Category from '../app/models/Category.model.js';
import Brand from '../app/models/Brand.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'catalog') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const adminToken = async () => {
  const admin = await User.create({
    name: 'Admin User',
    email: uniqueEmail('admin'),
    password: 'password123',
    role: 'Admin',
  });
  return generateTestToken({ sub: admin._id.toString(), roles: ['Admin'] });
};

const customerToken = async () => {
  const customer = await User.create({
    name: 'Customer',
    email: uniqueEmail('customer'),
    password: 'password123',
    role: 'Customer',
  });
  return generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });
};

describe('Catalog API (categories / subcategories / brands)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('Categories', () => {
    it('lets an admin create a category', async () => {
      const token = await adminToken();

      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Electronics' })
        .expect(201);

      expect(res.body.message).toBe('Category created');
      expect(res.body.data.name).toBe('Electronics');
    });

    it('lists categories publicly (no auth)', async () => {
      await Category.create({ name: 'Books' });

      const res = await request(app).get('/api/v1/categories').expect(200);

      expect(res.body.message).toBe('Categories retrieved');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((c) => c.name === 'Books')).toBe(true);
    });

    it('lets an admin update a category', async () => {
      const token = await adminToken();
      const category = await Category.create({ name: 'Old Name' });

      const res = await request(app)
        .put(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body.message).toBe('Category updated');
      expect(res.body.data.name).toBe('New Name');
    });

    it('returns 404 when updating an unknown category', async () => {
      const token = await adminToken();

      const res = await request(app)
        .put(`/api/v1/categories/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X' })
        .expect(404);

      expect(res.body.message).toBe('Category not found');
    });

    it('soft-deletes a category so it disappears from the public list', async () => {
      const token = await adminToken();
      const category = await Category.create({ name: 'Toys' });

      await request(app)
        .delete(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const listRes = await request(app).get('/api/v1/categories').expect(200);
      expect(listRes.body.data.some((c) => c._id === category._id.toString())).toBe(false);
    });

    it('rejects a duplicate category name with 409', async () => {
      const token = await adminToken();
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Groceries' })
        .expect(201);

      await Category.syncIndexes(); // ensure the unique partial index is built

      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Groceries' })
        .expect(409);

      expect(res.body.message).toBe('A record with this value already exists');
    });

    it('rejects creating a category without a name (400)', async () => {
      const token = await adminToken();

      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('rejects an unauthenticated create with 401', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Nope' })
        .expect(401);
      expect(res.body.message).toBe('Authentication required');
    });

    it('rejects a non-admin create with 403', async () => {
      const token = await customerToken();

      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nope' })
        .expect(403);

      expect(res.body.message).toBe('You must be a Admin');
    });
  });

  describe('SubCategories', () => {
    it('lets an admin create a subcategory under a category', async () => {
      const token = await adminToken();
      const category = await Category.create({ name: 'Electronics' });

      const res = await request(app)
        .post('/api/v1/subcategories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Phones', category: category._id.toString() })
        .expect(201);

      expect(res.body.message).toBe('SubCategory created');
      expect(res.body.data.name).toBe('Phones');
    });

    it('lists subcategories publicly (no auth)', async () => {
      const res = await request(app).get('/api/v1/subcategories').expect(200);
      expect(res.body.message).toBe('SubCategories retrieved');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('rejects a subcategory with an invalid category id (400)', async () => {
      const token = await adminToken();

      const res = await request(app)
        .post('/api/v1/subcategories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Orphan', category: 'not-a-mongo-id' })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'category')).toBe(true);
    });

    it('returns 404 when updating an unknown subcategory', async () => {
      const token = await adminToken();

      const res = await request(app)
        .put(`/api/v1/subcategories/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X' })
        .expect(404);

      expect(res.body.message).toBe('SubCategory not found');
    });
  });

  describe('Brands', () => {
    it('lets an admin create a brand', async () => {
      const token = await adminToken();

      const res = await request(app)
        .post('/api/v1/brands')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Acme' })
        .expect(201);

      expect(res.body.message).toBe('Brand created');
      expect(res.body.data.name).toBe('Acme');
    });

    it('lists brands publicly (no auth)', async () => {
      await Brand.create({ name: 'Globex' });

      const res = await request(app).get('/api/v1/brands').expect(200);
      expect(res.body.message).toBe('Brands retrieved');
      expect(res.body.data.some((b) => b.name === 'Globex')).toBe(true);
    });

    it('returns a paginated brand listing', async () => {
      await Brand.create({ name: 'Initech' });
      await Brand.create({ name: 'Umbrella' });

      const res = await request(app)
        .get('/api/v1/brands/paginated?page=1&pageSize=10')
        .expect(200);

      expect(res.body.message).toBe('Brands retrieved');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.totalItems).toBe(2);
    });

    it('returns 404 when updating an unknown brand', async () => {
      const token = await adminToken();

      const res = await request(app)
        .put(`/api/v1/brands/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X' })
        .expect(404);

      expect(res.body.message).toBe('Brand not found');
    });

    it('soft-deletes a brand so it disappears from the public list', async () => {
      const token = await adminToken();
      const brand = await Brand.create({ name: 'Soylent' });

      await request(app)
        .delete(`/api/v1/brands/${brand._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const listRes = await request(app).get('/api/v1/brands').expect(200);
      expect(listRes.body.data.some((b) => b._id === brand._id.toString())).toBe(false);
    });
  });
});

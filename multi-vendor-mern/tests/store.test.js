import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'store') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

// Seed a seller (optionally approved, optionally with a store) and a Seller token.
const seedSeller = async ({ status = 'Approved', withStore = true } = {}) => {
  const n = nextUid();
  const seller = await User.create({
    name: `Seller ${n}`,
    email: uniqueEmail('seller'),
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
  let store = null;
  if (withStore) {
    store = await Store.create({
      sellerProfile: profile._id,
      name: `Store ${n}`,
      description: 'A store',
      city: 'Lahore',
      isActive: true,
    });
  }
  const token = generateTestToken({ sub: seller._id.toString(), roles: ['Seller'] });
  return { seller, profile, store, token };
};

describe('Store API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('GET /api/v1/stores/mine', () => {
    it('returns the approved seller own store', async () => {
      const { token, store } = await seedSeller();

      const res = await request(app)
        .get('/api/v1/stores/mine')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Store retrieved');
      expect(res.body.data.name).toBe(store.name);
    });

    it('returns null when the approved seller has no store yet', async () => {
      const { token } = await seedSeller({ withStore: false });

      const res = await request(app)
        .get('/api/v1/stores/mine')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('No store found');
      expect(res.body.data).toBeNull();
    });

    it('returns null when the seller is not approved', async () => {
      const { token } = await seedSeller({ status: 'Pending', withStore: false });

      const res = await request(app)
        .get('/api/v1/stores/mine')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('No store found');
      expect(res.body.data).toBeNull();
    });
  });

  describe('PUT /api/v1/stores/mine', () => {
    it('updates allowed fields and ignores protected ones', async () => {
      const { token } = await seedSeller();

      const res = await request(app)
        .put('/api/v1/stores/mine')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Renamed Store', city: 'Karachi', isActive: false })
        .expect(200);

      expect(res.body.message).toBe('Store updated');
      expect(res.body.data.name).toBe('Renamed Store');
      expect(res.body.data.city).toBe('Karachi');
      // isActive is not an allowed update field, so it stays true.
      expect(res.body.data.isActive).toBe(true);
    });

    it('returns 404 when the approved seller has no store', async () => {
      const { token } = await seedSeller({ withStore: false });

      const res = await request(app)
        .put('/api/v1/stores/mine')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X' })
        .expect(404);

      expect(res.body.message).toBe('Store not found');
    });

    it('rejects an unapproved seller with 403', async () => {
      const { token } = await seedSeller({ status: 'Pending' });

      const res = await request(app)
        .put('/api/v1/stores/mine')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X' })
        .expect(403);

      expect(res.body.message).toBe('Your seller account is not approved');
    });
  });

  describe('DELETE /api/v1/stores/mine', () => {
    it('deactivates the seller store', async () => {
      const { token, store } = await seedSeller();

      const res = await request(app)
        .delete('/api/v1/stores/mine')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Store deactivated');

      const dbStore = await Store.findById(store._id).lean();
      expect(dbStore.isActive).toBe(false);
    });
  });

  describe('GET /api/v1/stores/:id', () => {
    it('returns a store by id', async () => {
      const { token, store } = await seedSeller();

      const res = await request(app)
        .get(`/api/v1/stores/${store._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Store retrieved');
      expect(res.body.data.name).toBe(store.name);
    });

    it('returns 404 for a valid but unknown store id', async () => {
      const { token } = await seedSeller();

      const res = await request(app)
        .get(`/api/v1/stores/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Store not found');
    });

    it('returns 404 (Resource not found) for a malformed store id', async () => {
      const { token } = await seedSeller();

      const res = await request(app)
        .get('/api/v1/stores/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Resource not found');
    });

    it('is publicly accessible without authentication', async () => {
      const { store } = await seedSeller();

      const res = await request(app).get(`/api/v1/stores/${store._id}`).expect(200);

      expect(res.body.message).toBe('Store retrieved');
      expect(res.body.data.name).toBe(store.name);
    });

    it('is accessible to a Customer', async () => {
      const customer = await User.create({
        name: 'Store Viewer',
        email: uniqueEmail('customer'),
        password: 'password123',
        role: 'Customer',
      });
      const customerToken = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });
      const { store } = await seedSeller();

      const res = await request(app)
        .get(`/api/v1/stores/${store._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.data.name).toBe(store.name);
    });

    it('is accessible to an Admin', async () => {
      const admin = await User.create({
        name: 'Admin',
        email: uniqueEmail('admin'),
        password: 'password123',
        role: 'Admin',
      });
      const adminToken = generateTestToken({ sub: admin._id.toString(), roles: ['Admin'] });
      const { store } = await seedSeller();

      const res = await request(app)
        .get(`/api/v1/stores/${store._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.name).toBe(store.name);
    });

    it('hides a suspended seller store from anonymous users with a neutral 404', async () => {
      const { store } = await seedSeller({ status: 'Suspended' });

      const res = await request(app).get(`/api/v1/stores/${store._id}`).expect(404);

      expect(res.body.message).toBe('Store not found');
    });
  });

  describe('authorization', () => {
    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app).get('/api/v1/stores/mine').expect(401);
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
        .get('/api/v1/stores/mine')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.message).toBe('You must be a Seller');
    });

    it('keeps PUT /mine protected from unauthenticated access with 401', async () => {
      const res = await request(app).put('/api/v1/stores/mine').send({ name: 'X' }).expect(401);
      expect(res.body.message).toBe('Authentication required');
    });

    it('keeps DELETE /mine protected from unauthenticated access with 401', async () => {
      const res = await request(app).delete('/api/v1/stores/mine').expect(401);
      expect(res.body.message).toBe('Authentication required');
    });

    it('keeps DELETE /mine protected from a Customer with 403', async () => {
      const customer = await User.create({
        name: 'Customer 2',
        email: uniqueEmail('customer'),
        password: 'password123',
        role: 'Customer',
      });
      const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

      const res = await request(app)
        .delete('/api/v1/stores/mine')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.message).toBe('You must be a Seller');
    });
  });
});

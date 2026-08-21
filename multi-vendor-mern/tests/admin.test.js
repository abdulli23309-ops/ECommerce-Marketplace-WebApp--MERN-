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
const uniqueEmail = (prefix = 'admin') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const createAdmin = async () => {
  const admin = await User.create({
    name: 'Admin User',
    email: uniqueEmail('admin'),
    password: 'password123',
    role: 'Admin',
  });
  const token = generateTestToken({ sub: admin._id.toString(), roles: ['Admin'] });
  return { admin, token };
};

const createUser = (overrides = {}) =>
  User.create({
    name: `User ${nextUid()}`,
    email: uniqueEmail('user'),
    password: 'password123',
    role: 'Customer',
    ...overrides,
  });

// A seller applicant: a User plus a Pending SellerProfile and an inactive Store.
const seedPendingSeller = async () => {
  const n = nextUid();
  const seller = await User.create({
    name: `Seller ${n}`,
    email: uniqueEmail('seller'),
    password: 'password123',
    role: 'Customer', // becomes 'Seller' only after approval
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Pending',
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
    isActive: false,
  });
  return { seller, profile, store };
};

describe('Admin core API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('GET /api/v1/admin/users', () => {
    it('lists all users (paged envelope)', async () => {
      const { token } = await createAdmin();
      await createUser();
      await createUser();

      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Users retrieved');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBe(3); // admin + 2 customers
      // Sensitive fields are stripped by the repository.
      expect(res.body.data.items[0]).not.toHaveProperty('password');
    });

    it('filters the user listing by role', async () => {
      const { token } = await createAdmin();
      await createUser();
      await createUser();

      const res = await request(app)
        .get('/api/v1/admin/users?role=Customer')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.total).toBe(2);
      expect(res.body.data.items.every((u) => u.role === 'Customer')).toBe(true);
    });
  });

  describe('PUT /api/v1/admin/users/:id/activate', () => {
    it('activates a deactivated user', async () => {
      const { token } = await createAdmin();
      const user = await createUser({ isActive: false });

      const res = await request(app)
        .put(`/api/v1/admin/users/${user._id}/activate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('User activated');
      expect(res.body.data.isActive).toBe(true);

      const dbUser = await User.findById(user._id).lean();
      expect(dbUser.isActive).toBe(true);
    });

    it('forbids an admin from modifying their own account (403)', async () => {
      const { admin, token } = await createAdmin();

      const res = await request(app)
        .put(`/api/v1/admin/users/${admin._id}/activate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.message).toBe('You cannot modify your own account');
    });

    it('returns 404 for a valid but unknown user id', async () => {
      const { token } = await createAdmin();

      const res = await request(app)
        .put(`/api/v1/admin/users/${new mongoose.Types.ObjectId()}/activate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('User not found');
    });

    it('returns 404 (Resource not found) for a malformed user id', async () => {
      const { token } = await createAdmin();

      const res = await request(app)
        .put('/api/v1/admin/users/not-a-valid-id/activate')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Resource not found');
    });
  });

  describe('PUT /api/v1/admin/users/:id/deactivate', () => {
    it('deactivates an active user', async () => {
      const { token } = await createAdmin();
      const user = await createUser({ isActive: true });

      const res = await request(app)
        .put(`/api/v1/admin/users/${user._id}/deactivate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('User deactivated');
      expect(res.body.data.isActive).toBe(false);

      const dbUser = await User.findById(user._id).lean();
      expect(dbUser.isActive).toBe(false);
    });

    it('forbids an admin from deactivating their own account (403)', async () => {
      const { admin, token } = await createAdmin();

      const res = await request(app)
        .put(`/api/v1/admin/users/${admin._id}/deactivate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.message).toBe('You cannot modify your own account');
    });
  });

  describe('GET /api/v1/admin/sellers', () => {
    it('lists seller profiles (paged envelope)', async () => {
      const { token } = await createAdmin();
      await seedPendingSeller();

      const res = await request(app)
        .get('/api/v1/admin/sellers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Sellers retrieved');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBe(1);
    });
  });

  describe('PUT /api/v1/admin/sellers/:id/approve', () => {
    it('approves a pending seller, activates the store, and promotes the user', async () => {
      const { token } = await createAdmin();
      const { seller, profile, store } = await seedPendingSeller();

      const res = await request(app)
        .put(`/api/v1/admin/sellers/${profile._id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Seller approved');
      expect(res.body.data.status).toBe('Approved');

      const dbProfile = await SellerProfile.findById(profile._id).lean();
      expect(dbProfile.status).toBe('Approved');
      expect(dbProfile.approvedAt).not.toBeNull();

      const dbStore = await Store.findById(store._id).lean();
      expect(dbStore.isActive).toBe(true);

      const dbUser = await User.findById(seller._id).lean();
      expect(dbUser.role).toBe('Seller');
    });

    it('returns 404 for a valid but unknown seller profile id', async () => {
      const { token } = await createAdmin();

      const res = await request(app)
        .put(`/api/v1/admin/sellers/${new mongoose.Types.ObjectId()}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Seller profile not found');
    });

    it('returns 404 (Resource not found) for a malformed seller profile id', async () => {
      const { token } = await createAdmin();

      const res = await request(app)
        .put('/api/v1/admin/sellers/not-a-valid-id/approve')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Resource not found');
    });
  });

  describe('PUT /api/v1/admin/sellers/:id/reject', () => {
    it('rejects a pending seller and records the reason', async () => {
      const { token } = await createAdmin();
      const { profile } = await seedPendingSeller();

      const res = await request(app)
        .put(`/api/v1/admin/sellers/${profile._id}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Incomplete documentation' })
        .expect(200);

      expect(res.body.message).toBe('Seller rejected');
      expect(res.body.data).toBeNull();

      const dbProfile = await SellerProfile.findById(profile._id).lean();
      expect(dbProfile.status).toBe('Rejected');
      expect(dbProfile.rejectionReason).toBe('Incomplete documentation');
    });

    it('returns 404 for a valid but unknown seller profile id', async () => {
      const { token } = await createAdmin();

      const res = await request(app)
        .put(`/api/v1/admin/sellers/${new mongoose.Types.ObjectId()}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'nope' })
        .expect(404);

      expect(res.body.message).toBe('Seller profile not found');
    });
  });

  describe('GET /api/v1/admin/stats', () => {
    it('returns aggregate dashboard statistics', async () => {
      const { token } = await createAdmin();
      await createUser();
      await seedPendingSeller();

      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Stats retrieved');
      expect(typeof res.body.data.totalUsers).toBe('number');
      expect(res.body.data.totalUsers).toBe(3); // admin + customer + seller-applicant
      expect(res.body.data.pendingSellerApprovals).toBe(1);
      expect(typeof res.body.data.totalRevenue).toBe('number');
    });
  });

  describe('authorization', () => {
    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app).get('/api/v1/admin/users').expect(401);
      expect(res.body.message).toBe('Authentication required');
    });

    it('rejects a non-admin (Customer) with 403', async () => {
      const customer = await createUser();
      const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.message).toBe('You must be a Admin');
    });
  });
});

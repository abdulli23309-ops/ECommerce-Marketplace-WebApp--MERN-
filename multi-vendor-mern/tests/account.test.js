import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';

let seq = 0;
const uniqueEmail = (prefix = 'acct') => {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}@example.com`;
};

const createUser = (overrides = {}) =>
  User.create({
    name: 'Account User',
    email: uniqueEmail(),
    password: 'password123',
    role: 'Customer',
    ...overrides,
  });

const tokenFor = (user, roles = ['Customer']) =>
  generateTestToken({ sub: user._id.toString(), roles });

describe('Account API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('authentication', () => {
    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app).get('/api/v1/account/profile').expect(401);
      expect(res.body.message).toBe('Authentication required');
    });
  });

  describe('GET /api/v1/account/profile', () => {
    it('returns the authenticated user profile without the password', async () => {
      const user = await createUser({ name: 'Jane Doe' });

      const res = await request(app)
        .get('/api/v1/account/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .expect(200);

      expect(res.body.message).toBe('Profile retrieved');
      expect(res.body.data.name).toBe('Jane Doe');
      expect(res.body.data.email).toBe(user.email);
      expect(res.body.data.role).toBe('Customer');
      expect(res.body.data.password).toBeUndefined();
    });

    it('returns 404 when the authenticated account no longer exists', async () => {
      const ghostId = new mongoose.Types.ObjectId().toString();
      const token = generateTestToken({ sub: ghostId, roles: ['Customer'] });

      const res = await request(app)
        .get('/api/v1/account/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('User not found');
    });
  });

  describe('PUT /api/v1/account/profile', () => {
    it('updates whitelisted fields (name) and ignores protected fields (role, email)', async () => {
      const user = await createUser({ name: 'Old Name' });

      const res = await request(app)
        .put('/api/v1/account/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ name: 'New Name', role: 'Admin', email: 'hacker@example.com' })
        .expect(200);

      expect(res.body.message).toBe('Profile updated');
      expect(res.body.data.name).toBe('New Name');
      // role/email are not in the whitelist and must be untouched.
      expect(res.body.data.role).toBe('Customer');
      expect(res.body.data.email).toBe(user.email);

      const fresh = await User.findById(user._id).lean();
      expect(fresh.name).toBe('New Name');
      expect(fresh.role).toBe('Customer');
      expect(fresh.email).toBe(user.email);
    });
  });

  describe('PUT /api/v1/account/password', () => {
    it('changes the password when the current password matches and the new password authenticates', async () => {
      const user = await createUser();

      const res = await request(app)
        .put('/api/v1/account/password')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ currentPassword: 'password123', newPassword: 'BrandNew456' })
        .expect(200);

      expect(res.body.message).toBe('Password changed successfully');
      expect(res.body.data).toBeNull();

      // The new password now works through the real login path.
      const loggedIn = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'BrandNew456' })
        .expect(200);
      expect(loggedIn.body.success).toBe(true);
    });

    it('rejects an incorrect current password with 401', async () => {
      const user = await createUser();

      const res = await request(app)
        .put('/api/v1/account/password')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'BrandNew456' })
        .expect(401);

      expect(res.body.message).toBe('Current password is incorrect');
    });
  });

  describe('GET /api/v1/account/permissions', () => {
    it('returns the permission array (empty when no role documents are seeded)', async () => {
      const user = await createUser();

      const res = await request(app)
        .get('/api/v1/account/permissions')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .expect(200);

      expect(res.body.message).toBe('Permissions fetched');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/v1/account/avatar', () => {
    it('rejects the request with 400 when no image file is attached', async () => {
      const user = await createUser();

      const res = await request(app)
        .put('/api/v1/account/avatar')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .expect(400);

      expect(res.body.message).toBe('No image uploaded');
    });
  });
});

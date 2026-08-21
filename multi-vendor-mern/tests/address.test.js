import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import Address from '../app/models/Address.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'addr') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const createCustomer = async () => {
  const customer = await User.create({
    name: 'Addr Customer',
    email: uniqueEmail('customer'),
    password: 'password123',
    role: 'Customer',
    emailVerified: true,
  });
  const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });
  return { customer, token };
};

const validAddress = (overrides = {}) => ({
  fullName: 'John Doe',
  phoneNumber: '03451234567',
  street: '123 Main St',
  city: 'Lahore',
  state: 'Punjab',
  postalCode: '54000',
  country: 'Pakistan',
  ...overrides,
});

// Seed an address directly (bypasses the auto-default service logic).
const seedAddress = (userId, overrides = {}) =>
  Address.create({ user: userId, ...validAddress(overrides) });

describe('Address API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('authentication', () => {
    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app).get('/api/v1/addresses').expect(401);
      expect(res.body.message).toBe('Authentication required');
    });
  });

  describe('GET /api/v1/addresses', () => {
    it('returns only the authenticated user addresses', async () => {
      const { customer, token } = await createCustomer();
      const { customer: other } = await createCustomer();
      await seedAddress(customer._id, { city: 'Lahore' });
      await seedAddress(customer._id, { city: 'Karachi', isDefault: false });
      await seedAddress(other._id, { city: 'Islamabad' }); // must not appear

      const res = await request(app)
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Addresses retrieved');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/v1/addresses', () => {
    it('creates the first address and marks it default automatically', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(validAddress())
        .expect(201);

      expect(res.body.message).toBe('Address created');
      expect(res.body.data.isDefault).toBe(true);
    });

    it('does not auto-default a second address', async () => {
      const { customer, token } = await createCustomer();
      await seedAddress(customer._id, { isDefault: true });

      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(validAddress({ city: 'Karachi' }))
        .expect(201);

      expect(res.body.data.isDefault).toBe(false);
    });

    it('re-points the default when a new address requests it', async () => {
      const { customer, token } = await createCustomer();
      const first = await seedAddress(customer._id, { isDefault: true });

      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(validAddress({ city: 'Karachi', isDefault: true }))
        .expect(201);

      expect(res.body.data.isDefault).toBe(true);

      const dbFirst = await Address.findById(first._id).lean();
      expect(dbFirst.isDefault).toBe(false);
    });

    it('rejects a missing required field with 400', async () => {
      const { token } = await createCustomer();
      const { city, ...withoutCity } = validAddress();

      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(withoutCity)
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'city')).toBe(true);
    });
  });

  describe('PUT /api/v1/addresses/:id', () => {
    it('updates an owned address', async () => {
      const { customer, token } = await createCustomer();
      const address = await seedAddress(customer._id);

      const res = await request(app)
        .put(`/api/v1/addresses/${address._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ city: 'Multan' })
        .expect(200);

      expect(res.body.message).toBe('Address updated');
      expect(res.body.data.city).toBe('Multan');
    });

    it('returns 404 when updating an address owned by another user', async () => {
      const { customer } = await createCustomer();
      const { token: otherToken } = await createCustomer();
      const address = await seedAddress(customer._id);

      const res = await request(app)
        .put(`/api/v1/addresses/${address._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ city: 'Multan' })
        .expect(404);

      expect(res.body.message).toBe('Address not found');
    });

    it('returns 404 (Resource not found) for a malformed id', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .put('/api/v1/addresses/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ city: 'Multan' })
        .expect(404);

      expect(res.body.message).toBe('Resource not found');
    });
  });

  describe('DELETE /api/v1/addresses/:id', () => {
    it('deletes an owned address', async () => {
      const { customer, token } = await createCustomer();
      const address = await seedAddress(customer._id);

      const res = await request(app)
        .delete(`/api/v1/addresses/${address._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Address deleted');

      const dbAddress = await Address.findById(address._id).lean();
      expect(dbAddress).toBeNull();
    });

    it('returns 404 when deleting an address owned by another user', async () => {
      const { customer } = await createCustomer();
      const { token: otherToken } = await createCustomer();
      const address = await seedAddress(customer._id);

      const res = await request(app)
        .delete(`/api/v1/addresses/${address._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(res.body.message).toBe('Address not found');
    });
  });

  describe('PUT /api/v1/addresses/:id/default', () => {
    it('sets an address as default and unsets the previous default', async () => {
      const { customer, token } = await createCustomer();
      const first = await seedAddress(customer._id, { isDefault: true });
      const second = await seedAddress(customer._id, { city: 'Karachi', isDefault: false });

      const res = await request(app)
        .put(`/api/v1/addresses/${second._id}/default`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Default address set');
      expect(res.body.data.isDefault).toBe(true);

      const dbFirst = await Address.findById(first._id).lean();
      expect(dbFirst.isDefault).toBe(false);
    });

    it('returns 404 when defaulting an address owned by another user', async () => {
      const { customer } = await createCustomer();
      const { token: otherToken } = await createCustomer();
      const address = await seedAddress(customer._id);

      const res = await request(app)
        .put(`/api/v1/addresses/${address._id}/default`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(res.body.message).toBe('Address not found');
    });
  });
});

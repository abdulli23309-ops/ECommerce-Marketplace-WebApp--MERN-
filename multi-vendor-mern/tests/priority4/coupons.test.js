import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import Coupon from '../../app/models/Coupon.model.js';

describe('Coupon API (Priority 4)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('allows admin to create a coupon', async () => {
    const admin = await User.create({
      name: 'Coupon Admin',
      email: `coupon-admin-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Admin',
    });

    const token = generateTestToken({
      sub: admin._id.toString(),
      roles: ['Admin'],
    });

    const res = await request(app)
      .post('/api/v1/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'SAVE10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 100,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        usageLimit: 100,
        isActive: true,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe('SAVE10');
  });

  it('rejects coupon creation for non-admin user', async () => {
    const customer = await User.create({
      name: 'Coupon Customer',
      email: `coupon-customer-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'NOPE',
        discountType: 'percentage',
        discountValue: 5,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      })
      .expect(403);

    expect(res.body.message).toContain('You must be a Admin');
  });

  it('validates a valid coupon and returns discount', async () => {
    const customer = await User.create({
      name: 'Valid Coupon User',
      email: `valid-coupon-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    await Coupon.create({
      code: 'WELCOME20',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      startsAt: new Date(Date.now() - 1000),
      expiresAt: new Date(Date.now() + 86400000),
      usageLimit: null,
      usageCount: 0,
      isActive: true,
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'WELCOME20', cartTotal: 500 })
      .expect(200);

    expect(res.body.data.coupon.code).toBe('WELCOME20');
    expect(res.body.data.discount).toBe(100);
  });

  it('rejects an expired coupon', async () => {
    const customer = await User.create({
      name: 'Expired Coupon User',
      email: `expired-coupon-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    await Coupon.create({
      code: 'OLD10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      startsAt: new Date(Date.now() - 200000),
      expiresAt: new Date(Date.now() - 100000),
      usageLimit: null,
      usageCount: 0,
      isActive: true,
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'OLD10', cartTotal: 500 })
      .expect(400);

    expect(res.body.message).toContain('expired');
  });

  it('rejects coupon when cart total is below minimum order amount', async () => {
    const customer = await User.create({
      name: 'Min Order User',
      email: `min-order-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    await Coupon.create({
      code: 'MIN500',
      discountType: 'fixed',
      discountValue: 50,
      minOrderAmount: 500,
      startsAt: new Date(Date.now() - 1000),
      expiresAt: new Date(Date.now() + 86400000),
      usageLimit: null,
      usageCount: 0,
      isActive: true,
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'MIN500', cartTotal: 250 })
      .expect(400);

    expect(res.body.message).toContain('Minimum order amount');
  });

  it('rejects coupon after usage limit is reached', async () => {
    const customer = await User.create({
      name: 'Usage Limit User',
      email: `usage-limit-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    await Coupon.create({
      code: 'LIMIT1',
      discountType: 'fixed',
      discountValue: 50,
      minOrderAmount: 0,
      startsAt: new Date(Date.now() - 1000),
      expiresAt: new Date(Date.now() + 86400000),
      usageLimit: 1,
      usageCount: 1,
      isActive: true,
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'LIMIT1', cartTotal: 500 })
      .expect(400);

    expect(res.body.message).toContain('usage limit');
  });
});
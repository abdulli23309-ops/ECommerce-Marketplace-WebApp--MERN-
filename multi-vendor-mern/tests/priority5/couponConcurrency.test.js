import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import Address from '../../app/models/Address.model.js';
import Store from '../../app/models/Store.model.js';
import SellerProfile from '../../app/models/SellerProfile.model.js';
import Product from '../../app/models/Product.model.js';
import Cart from '../../app/models/Cart.model.js';
import Coupon from '../../app/models/Coupon.model.js';
import CouponUsage from '../../app/models/CouponUsage.model.js';
import * as couponRepo from '../../app/repositories/Coupon.repository.js';

// M-015 — Coupon usageLimit must be enforced atomically across concurrent
// redemptions. The production redemption path uses couponRepo.incrementUsageIfAvailable,
// a single conditional MongoDB update ({ usageCount: { $lt: limit } } + $inc)
// so the limit check and the increment cannot be torn apart by a race.

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix) => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const createCoupon = (overrides = {}) =>
  Coupon.create({
    code: `M015${nextUid()}`,
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 0,
    startsAt: new Date(Date.now() - 1000),
    expiresAt: new Date(Date.now() + 86400000),
    usageLimit: 1,
    usageCount: 0,
    isActive: true,
    ...overrides,
  });

// Fire `count` concurrent redemption attempts against the production atomic
// repository method that checkout/redeemCoupon use.
const runConcurrentRedemptions = (count, couponId, limit) =>
  Promise.all(
    Array.from({ length: count }, () =>
      couponRepo.incrementUsageIfAvailable(couponId, limit)
    )
  );

describe('M-015: Coupon usageLimit concurrency', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('usageLimit=1: exactly 1 of 2 concurrent redemptions succeeds, usageCount stays 1', async () => {
    const coupon = await createCoupon({ usageLimit: 1, usageCount: 0 });

    const results = await runConcurrentRedemptions(2, coupon._id, coupon.usageLimit);

    const succeeded = results.filter(Boolean).length;
    expect(succeeded).toBe(1);
    expect(results.filter((r) => !r).length).toBe(1);

    const updated = await Coupon.findById(coupon._id).lean();
    expect(updated.usageCount).toBe(1); // never 2 — the core M-015 guarantee
  });

  it('usageLimit=3: exactly 3 of 5 concurrent redemptions succeed, usageCount stays 3', async () => {
    const coupon = await createCoupon({ usageLimit: 3, usageCount: 0 });

    const results = await runConcurrentRedemptions(5, coupon._id, coupon.usageLimit);

    expect(results.filter(Boolean).length).toBe(3);
    expect(results.filter((r) => !r).length).toBe(2);

    const updated = await Coupon.findById(coupon._id).lean();
    expect(updated.usageCount).toBe(3); // not 5
  });

  it('unlimited coupon (null usageLimit) still allows every concurrent redemption', async () => {
    const coupon = await createCoupon({ usageLimit: null, usageCount: 0 });

    const results = await runConcurrentRedemptions(5, coupon._id, coupon.usageLimit);

    expect(results.filter(Boolean).length).toBe(5);
    const updated = await Coupon.findById(coupon._id).lean();
    expect(updated.usageCount).toBe(5);
  });

  it('an already-exhausted coupon rejects further redemptions without over-incrementing', async () => {
    const coupon = await createCoupon({ usageLimit: 1, usageCount: 1 });

    const result = await couponRepo.incrementUsageIfAvailable(coupon._id, coupon.usageLimit);

    expect(result).toBeNull();
    const updated = await Coupon.findById(coupon._id).lean();
    expect(updated.usageCount).toBe(1);
  });

  it('integration: two concurrent real checkouts over a usageLimit=1 coupon yield exactly one success and usageCount=1', async () => {
    // Shared seller/store/product plus a coupon used by two different customers.
    const seller = await User.create({
      name: 'M015 Seller',
      email: uniqueEmail('m015-seller'),
      password: 'password123',
      role: 'Seller',
    });
    const profile = await SellerProfile.create({
      user: seller._id,
      status: 'Approved',
      businessName: 'M015 Business',
      taxId: `TAX-${nextUid()}`,
      phone: '03001234567',
      address: 'Lahore',
    });
    const store = await Store.create({
      sellerProfile: profile._id,
      name: 'M015 Store',
      description: 'store',
      city: 'Lahore',
    });
    const product = await Product.create({
      name: 'M015 Product',
      description: 'p',
      price: 100,
      stock: 50,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });
    const coupon = await createCoupon({ usageLimit: 1, usageCount: 0 });

    // Build independent, valid checkout customers sharing the coupon.
    const buildCustomer = async () => {
      const customer = await User.create({
        name: 'M015 Customer',
        email: uniqueEmail('m015-customer'),
        password: 'password123',
        role: 'Customer',
        emailVerified: true,
      });
      const address = await Address.create({
        user: customer._id,
        fullName: 'John Doe',
        phoneNumber: '03451234567',
        street: '123 Main St',
        city: 'Lahore',
        state: 'Punjab',
        postalCode: '54000',
        country: 'Pakistan',
      });
      await Cart.create({
        user: customer._id,
        items: [{ product: product._id, price: 100, quantity: 1 }],
      });
      const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });
      return { token, address };
    };

    const customerA = await buildCustomer();
    const customerB = await buildCustomer();

    const attempt = ({ token, address }) =>
      request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId: address._id.toString(), couponCode: coupon.code, paymentMethod: 'CashOnDelivery' });

    const [resA, resB] = await Promise.all([
      attempt(customerA),
      attempt(customerB),
    ]);

    const statuses = [resA.status, resB.status];
    // Exactly one checkout may succeed; the losing redemption must not commit
    // (it fails cleanly — either the coupon is exhausted or the race is lost).
    expect(statuses.filter((s) => s === 200).length).toBe(1);
    expect(statuses.filter((s) => s !== 200).length).toBe(1);

    const updated = await Coupon.findById(coupon._id).lean();
    expect(updated.usageCount).toBe(1); // never 2

    const usageRecords = await CouponUsage.find({ coupon: coupon._id }).lean();
    expect(usageRecords.length).toBe(1); // audit trail matches exactly one redemption
  });
});


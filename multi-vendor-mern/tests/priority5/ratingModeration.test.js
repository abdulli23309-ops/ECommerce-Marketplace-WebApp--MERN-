import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import SellerProfile from '../../app/models/SellerProfile.model.js';
import Store from '../../app/models/Store.model.js';
import Product from '../../app/models/Product.model.js';
import ParentOrder from '../../app/models/ParentOrder.model.js';
import SellerOrder from '../../app/models/SellerOrder.model.js';
import Review from '../../app/models/Review.model.js';

const MAX_WARNINGS = 3;

// Monotonic counter guarantees unique emails within and across tests.
let uid = 0;
const nextUid = () => (uid += 1);

const createCustomer = async () => {
  const n = nextUid();
  return User.create({
    name: `Customer ${n}`,
    email: `customer-rating-${Date.now()}-${n}@example.com`,
    password: 'password123',
    role: 'Customer',
  });
};

const createAdminToken = async () => {
  const n = nextUid();
  const admin = await User.create({
    name: 'Admin User',
    email: `admin-rating-${Date.now()}-${n}@example.com`,
    password: 'password123',
    role: 'Admin',
  });
  return generateTestToken({ sub: admin._id.toString(), roles: ['Admin'] });
};

// Creates a seller with an approved store, one product, and a delivered
// seller order that reviews can be attached to. Returns the ids under test.
const setupSeller = async () => {
  const n = nextUid();
  const seller = await User.create({
    name: 'Rating Seller',
    email: `seller-rating-${Date.now()}-${n}@example.com`,
    password: 'password123',
    role: 'Seller',
  });

  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Rating Store',
    taxId: '123',
    phone: '03001234567',
    address: 'Lahore',
  });

  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Rating Store',
    description: 'Rating store',
    city: 'Lahore',
  });

  const product = await Product.create({
    name: 'Rating Product',
    description: 'Rating product',
    price: 100,
    stock: 10,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
  });

  const orderCustomer = await createCustomer();
  const parentOrder = await ParentOrder.create({
    customer: orderCustomer._id,
    orderStatus: 'Delivered',
    shippingFullName: orderCustomer.name,
    shippingPhone: '03451234567',
    shippingAddressLine1: 'Main Street',
    shippingCity: 'Lahore',
    shippingState: 'Punjab',
    shippingPostalCode: '54000',
    totalAmount: 100,
  });

  const sellerOrder = await SellerOrder.create({
    parentOrder: parentOrder._id,
    store: store._id,
    subTotal: 100,
    status: 'Delivered',
    items: [
      {
        product: product._id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: product.price,
        quantity: 1,
      },
    ],
  });

  return { profile, store, product, sellerOrder };
};

// Adds `count` reviews of a given rating, each from a distinct customer so the
// (customer, product, sellerOrder) unique index is satisfied.
const addReviews = async (product, sellerOrder, rating, count) => {
  for (let i = 0; i < count; i += 1) {
    const customer = await createCustomer();
    await Review.create({
      customer: customer._id,
      product: product._id,
      sellerOrder: sellerOrder._id,
      rating,
    });
  }
};

const warnSeller = (token, profileId) =>
  request(app)
    .post(`/api/v1/admin/sellers/${profileId}/warn`)
    .set('Authorization', `Bearer ${token}`)
    .send({ reason: 'Low rating test' });

const sellerStatus = (token, profileId) =>
  request(app)
    .get(`/api/v1/admin/sellers/${profileId}/moderation-status`)
    .set('Authorization', `Bearer ${token}`);

const warnProduct = (token, productId) =>
  request(app)
    .post(`/api/v1/admin/products/${productId}/warn`)
    .set('Authorization', `Bearer ${token}`)
    .send({ reason: 'Low rating test' });

const productStatus = (token, productId) =>
  request(app)
    .get(`/api/v1/admin/products/${productId}/moderation-status`)
    .set('Authorization', `Bearer ${token}`);

describe('Priority 5 — Rating Moderation', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('Seller moderation', () => {
    it('flags low rating and progresses warnings from 0 up to MAX_WARNINGS, capping at the limit', async () => {
      const token = await createAdminToken();
      const { profile, product, sellerOrder } = await setupSeller();

      // Two 1-star reviews => average 1.0, below the 2.5 seller threshold.
      await addReviews(product, sellerOrder, 1, 2);

      const initial = await sellerStatus(token, profile._id).expect(200);
      expect(initial.body.data.lowRatingStatus).toBe(true);
      expect(initial.body.data.warningCount).toBe(0);
      expect(initial.body.data.canWarn).toBe(true);

      // Warning progression: 1/3 -> 2/3 -> 3/3.
      for (let expected = 1; expected <= MAX_WARNINGS; expected += 1) {
        const res = await warnSeller(token, profile._id).expect(200);
        expect(res.body.data.warningCount).toBe(expected);
      }

      // A further warning must be rejected — warningCount cannot exceed MAX_WARNINGS.
      const overLimit = await warnSeller(token, profile._id).expect(400);
      expect(overLimit.body.message).toMatch(/limit/i);

      const capped = await sellerStatus(token, profile._id).expect(200);
      expect(capped.body.data.warningCount).toBe(MAX_WARNINGS);
      expect(capped.body.data.canWarn).toBe(false);
    });

    it('on recovery clears lowRatingStatus, resets warningCount to 0, and preserves warningHistory', async () => {
      const token = await createAdminToken();
      const { profile, product, sellerOrder } = await setupSeller();

      await addReviews(product, sellerOrder, 1, 2);

      await warnSeller(token, profile._id).expect(200);
      const second = await warnSeller(token, profile._id).expect(200);
      expect(second.body.data.warningCount).toBe(2);

      // Five 5-star reviews lift the average to (2 + 25) / 7 ≈ 3.86, above threshold.
      await addReviews(product, sellerOrder, 5, 5);

      const recovered = await sellerStatus(token, profile._id).expect(200);
      expect(recovered.body.data.lowRatingStatus).toBe(false);
      expect(recovered.body.data.warningCount).toBe(0);
      expect(recovered.body.data.canWarn).toBe(false);
      // History is a permanent audit trail — the two prior warnings remain.
      expect(Array.isArray(recovered.body.data.warningHistory)).toBe(true);
      expect(recovered.body.data.warningHistory).toHaveLength(2);
    });

    it('starts a fresh warning cycle when the rating drops below threshold again, keeping old history', async () => {
      const token = await createAdminToken();
      const { profile, product, sellerOrder } = await setupSeller();

      await addReviews(product, sellerOrder, 1, 2);
      await warnSeller(token, profile._id).expect(200); // count 1, history length 1

      // Recover above threshold — resets count to 0, keeps the single history entry.
      await addReviews(product, sellerOrder, 5, 5);
      const recovered = await sellerStatus(token, profile._id).expect(200);
      expect(recovered.body.data.warningCount).toBe(0);
      expect(recovered.body.data.warningHistory).toHaveLength(1);

      // Relapse: remove the recovering reviews so the average falls back to 1.0.
      await Review.deleteMany({ product: product._id, rating: 5 });

      const relapsed = await sellerStatus(token, profile._id).expect(200);
      expect(relapsed.body.data.lowRatingStatus).toBe(true);
      expect(relapsed.body.data.warningCount).toBe(0); // fresh cycle starts at 0

      // The new cycle begins at 1/3 and appends to the preserved history.
      const warned = await warnSeller(token, profile._id).expect(200);
      expect(warned.body.data.warningCount).toBe(1);

      const afterWarn = await sellerStatus(token, profile._id).expect(200);
      expect(afterWarn.body.data.warningHistory).toHaveLength(2); // 1 old + 1 new
    });
  });

  describe('Product moderation', () => {
    it('flags low rating and progresses warnings from 0 up to MAX_WARNINGS, capping at the limit', async () => {
      const token = await createAdminToken();
      const { product, sellerOrder } = await setupSeller();

      // Two 1-star reviews => average 1.0, below the 3.0 product threshold.
      await addReviews(product, sellerOrder, 1, 2);

      const initial = await productStatus(token, product._id).expect(200);
      expect(initial.body.data.lowRatingStatus).toBe(true);
      expect(initial.body.data.warningCount).toBe(0);
      expect(initial.body.data.canWarn).toBe(true);

      for (let expected = 1; expected <= MAX_WARNINGS; expected += 1) {
        const res = await warnProduct(token, product._id).expect(200);
        expect(res.body.data.warningCount).toBe(expected);
      }

      const overLimit = await warnProduct(token, product._id).expect(400);
      expect(overLimit.body.message).toMatch(/limit/i);

      const capped = await productStatus(token, product._id).expect(200);
      expect(capped.body.data.warningCount).toBe(MAX_WARNINGS);
      expect(capped.body.data.canWarn).toBe(false);
    });

    it('on recovery clears lowRatingStatus, resets warningCount to 0, and preserves warningHistory', async () => {
      const token = await createAdminToken();
      const { product, sellerOrder } = await setupSeller();

      await addReviews(product, sellerOrder, 1, 2);

      await warnProduct(token, product._id).expect(200);
      const second = await warnProduct(token, product._id).expect(200);
      expect(second.body.data.warningCount).toBe(2);

      // Five 5-star reviews lift the average to ≈ 3.86, above the 3.0 threshold.
      await addReviews(product, sellerOrder, 5, 5);

      const recovered = await productStatus(token, product._id).expect(200);
      expect(recovered.body.data.lowRatingStatus).toBe(false);
      expect(recovered.body.data.warningCount).toBe(0);
      expect(recovered.body.data.canWarn).toBe(false);
      expect(Array.isArray(recovered.body.data.warningHistory)).toBe(true);
      expect(recovered.body.data.warningHistory).toHaveLength(2);
    });
  });
});

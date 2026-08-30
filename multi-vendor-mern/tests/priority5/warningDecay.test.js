import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import SellerProfile from '../../app/models/SellerProfile.model.js';
import Store from '../../app/models/Store.model.js';
import Product from '../../app/models/Product.model.js';
import Review from '../../app/models/Review.model.js';
import ParentOrder from '../../app/models/ParentOrder.model.js';
import SellerOrder from '../../app/models/SellerOrder.model.js';

// Constants mirrored from RatingModeration.service.js for assertions.
const PRODUCT_LOW_RATING_THRESHOLD = 3.0;
const SELLER_LOW_RATING_THRESHOLD = 2.5;
const WARNING_DECAY_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const createCustomer = async () => {
  const n = Date.now() + Math.random();
  return User.create({
    name: `Customer ${n}`,
    email: `customer-decay-${n}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Customer',
  });
};

const createSeller = async () => {
  const n = Date.now() + Math.random();
  const seller = await User.create({
    name: 'Decay Test Seller',
    email: `decay-${n}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Seller',
  });

  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Decay Store',
    taxId: '1234567890',
    phone: '03001234567',
    address: 'Lahore',
  });

  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Decay Store',
    description: 'Decay store',
    city: 'Lahore',
  });

  return { seller, profile, store };
};

const createProductWithReviews = async (store, profile, rating = 1, count = 2) => {
  const product = await Product.create({
    name: `Decay Product ${Date.now()}`,
    description: 'Product for decay test',
    price: 200,
    stock: 10,
    store: store._id,
    status: 'Approved',
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
  });

  // Create delivered order for reviews
  const orderCustomer = await createCustomer();
  const parentOrder = await ParentOrder.create({
    customer: orderCustomer._id,
    orderStatus: 'Delivered',
    shippingFullName: orderCustomer.name,
    shippingPhone: '03001234567',
    shippingAddressLine1: 'Main Street',
    shippingCity: 'Lahore',
    shippingState: 'Punjab',
    shippingPostalCode: '54000',
    totalAmount: product.price * count,
  });

  const sellerOrder = await SellerOrder.create({
    parentOrder: parentOrder._id,
    store: store._id,
    subTotal: product.price * count,
    status: 'Delivered',
    items: [
      {
        product: product._id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: product.price,
        quantity: count,
      },
    ],
  });

  // Add reviews with given rating
  for (let i = 0; i < count; i++) {
    const customer = await createCustomer();
    await Review.create({
      customer: customer._id,
      product: product._id,
      sellerOrder: sellerOrder._id,
      rating,
    });
  }

  return { product, sellerOrder };
};

const makeAdmin = async () => {
  const admin = await User.create({
    name: 'Admin User',
    email: `admin-decay-${Date.now()}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Admin',
  });
  return {
    admin,
    token: generateTestToken({ sub: admin._id.toString(), roles: ['Admin'] }),
  };
};

// Uses the ADMIN token (moderation-status is admin-only).
const issueSellerWarning = async (sellerProfileId, adminTokenStr, reason) =>
  request(app)
    .post(`/api/v1/admin/sellers/${sellerProfileId}/warn`)
    .set('Authorization', `Bearer ${adminTokenStr}`)
    .send({ reason });

const getSellerStatus = async (sellerProfileId, adminTokenStr) =>
  request(app)
    .get(`/api/v1/admin/sellers/${sellerProfileId}/moderation-status`)
    .set('Authorization', `Bearer ${adminTokenStr}`);

const getProductStatus = async (productId, adminTokenStr) =>
  request(app)
    .get(`/api/v1/admin/products/${productId}/moderation-status`)
    .set('Authorization', `Bearer ${adminTokenStr}`);

const issueProductWarning = async (productId, adminTokenStr, reason) =>
  request(app)
    .post(`/api/v1/admin/products/${productId}/warn`)
    .set('Authorization', `Bearer ${adminTokenStr}`)
    .send({ reason });

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// Helper to set up a seller with low rating (so warnings can be issued)
const setupSellerWithLowRating = async () => {
  const { seller, profile, store } = await createSeller();
  // Create product with 1-star reviews to trigger lowRatingStatus
  await createProductWithReviews(store, profile, 1, 2);
  const { token: adminTok } = await makeAdmin();
  // Trigger recalculation to set lowRatingStatus
  await getSellerStatus(profile._id, adminTok);
  return { seller, profile, store, adminTok };
};

// Helper to set up a product with low rating
const setupProductWithLowRating = async () => {
  const { seller, profile, store } = await createSeller();
  const { product } = await createProductWithReviews(store, profile, 1, 2);
  const { token: adminTok } = await makeAdmin();
  await getProductStatus(product._id, adminTok);
  return { seller, profile, store, product, adminTok };
};

describe('Priority 5 — Warning Decay (Spec D4 / D5)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('7-day warning decay', () => {
    it('effective warning count becomes 0 after 7 days from most recent warning', async () => {
      const { profile, adminTok } = await setupSellerWithLowRating();

      const warnRes = await issueSellerWarning(profile._id, adminTok, 'Low rating test');
      expect(warnRes.status).toBe(200);
      expect(warnRes.body.data.warningCount).toBe(1);

      const afterWarn = await getSellerStatus(profile._id, adminTok);
      expect(afterWarn.body.data.warningCount).toBe(1);

      // Simulate passage of 7+ days.
      await SellerProfile.updateOne(
        { _id: profile._id },
        { $set: { lastSellerWarningAt: daysAgo(7) } }
      );

      const afterDecay = await getSellerStatus(profile._id, adminTok);
      expect(afterDecay.body.data.warningCount).toBe(0);
    });

    it('effective warning count stays > 0 within 7-day window', async () => {
      const { profile, adminTok } = await setupSellerWithLowRating();

      const warnRes = await issueSellerWarning(profile._id, adminTok, 'Low rating test');
      expect(warnRes.status).toBe(200);

      const status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.warningCount).toBe(1);
    });
  });

  describe('timer resets from the most recent warning', () => {
    it('new warning resets the 7-day decay timer', async () => {
      const { profile, adminTok } = await setupSellerWithLowRating();

      // First warning.
      const warn1 = await issueSellerWarning(profile._id, adminTok, 'First warning');
      expect(warn1.status).toBe(200);

      // Push the timer 8 days back (would have decayed).
      await SellerProfile.updateOne(
        { _id: profile._id },
        { $set: { lastSellerWarningAt: daysAgo(8) } }
      );

      // Second warning resets the timer.
      const warn2 = await issueSellerWarning(profile._id, adminTok, 'Second warning');
      expect(warn2.status).toBe(200);

      const status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.warningCount).toBe(2);
      expect(status.body.data.storedWarningCount).toBe(2);

      // Now push 14 days back from the second warning → should decay to 0.
      await SellerProfile.updateOne(
        { _id: profile._id },
        { $set: { lastSellerWarningAt: daysAgo(14) } }
      );

      const afterDecay = await getSellerStatus(profile._id, adminTok);
      expect(afterDecay.body.data.warningCount).toBe(0);
    });
  });

  describe('effective warning count becomes 0 after decay', () => {
    it('seller profile effective count decays to 0 after 7 days', async () => {
      const { profile, adminTok } = await setupSellerWithLowRating();

      const warnRes = await issueSellerWarning(profile._id, adminTok, 'Decay test');
      expect(warnRes.status).toBe(200);

      let status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.warningCount).toBe(1);
      expect(status.body.data.storedWarningCount).toBe(1);

      await SellerProfile.updateOne(
        { _id: profile._id },
        { $set: { lastSellerWarningAt: daysAgo(7) } }
      );

      status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.warningCount).toBe(0); // effective = 0
      expect(status.body.data.storedWarningCount).toBe(1); // stored still 1
    });
  });

  describe('lowRatingStatus remains independent', () => {
    it('lowRatingStatus and warningCount are independent fields', async () => {
      const { profile, adminTok } = await setupSellerWithLowRating();

      // Issue a warning and confirm the status payload exposes both fields
      // independently (the decay of warningCount must not clear lowRatingStatus
      // and vice versa).
      const warnRes = await issueSellerWarning(profile._id, adminTok, 'Independence test');
      expect(warnRes.status).toBe(200);

      const status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data).toHaveProperty('lowRatingStatus');
      expect(status.body.data).toHaveProperty('warningCount');
      expect(status.body.data).toHaveProperty('storedWarningCount');
      expect(status.body.data).toHaveProperty('warningHistory');

      // After decay the effective warning count is 0 but lowRatingStatus is still
      // reported from the rating predicate (a boolean that is unaffected by decay).
      await SellerProfile.updateOne(
        { _id: profile._id },
        { $set: { lastSellerWarningAt: daysAgo(7) } }
      );

      const decayed = await getSellerStatus(profile._id, adminTok);
      expect(decayed.body.data.warningCount).toBe(0);
      expect(decayed.body.data).toHaveProperty('lowRatingStatus');
    });
  });

  describe('new warning can be issued after decay', () => {
    it('seller can receive new warning after previous one has decayed', async () => {
      const { profile, adminTok } = await setupSellerWithLowRating();

      const warnRes = await issueSellerWarning(profile._id, adminTok, 'First warning');
      expect(warnRes.status).toBe(200);

      await SellerProfile.updateOne(
        { _id: profile._id },
        { $set: { lastSellerWarningAt: daysAgo(7) } }
      );

      // New warning should succeed (effective count was 0).
      const res = await issueSellerWarning(profile._id, adminTok, 'New warning after decay');
      expect(res.status).toBe(200);

      const status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.warningCount).toBe(2); // fresh cycle, stored grows
      expect(status.body.data.storedWarningCount).toBe(2); // history grows
    });
  });

  describe('seller warning decay', () => {
    it('seller profile warningCount stores permanently but effective count decays', async () => {
      const { profile, adminTok } = await setupSellerWithLowRating();

      const warnRes = await issueSellerWarning(profile._id, adminTok, 'Store count test');
      expect(warnRes.status).toBe(200);

      let status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.storedWarningCount).toBe(1);
      expect(status.body.data.warningCount).toBe(1);

      await SellerProfile.updateOne(
        { _id: profile._id },
        { $set: { lastSellerWarningAt: daysAgo(7) } }
      );

      status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.storedWarningCount).toBe(1); // preserved
      expect(status.body.data.warningCount).toBe(0); // effective = 0
    });
  });

  describe('product warning decay', () => {
    it('product warning effective count decays after 7 days', async () => {
      const { product, adminTok } = await setupProductWithLowRating();

      const warnRes = await issueProductWarning(product._id, adminTok, 'Low product rating test');
      expect(warnRes.status).toBe(200);

      let prodStatus = await getProductStatus(product._id, adminTok);
      expect(prodStatus.status).toBe(200);
      expect(prodStatus.body.data.warningCount).toBe(1);

      await Product.updateOne(
        { _id: product._id },
        { $set: { lastProductWarningAt: daysAgo(7) } }
      );

      prodStatus = await getProductStatus(product._id, adminTok);
      expect(prodStatus.body.data.warningCount).toBe(0); // effective decays
    });

    it('product storedWarningCount preserved after effective decay', async () => {
      const { product, adminTok } = await setupProductWithLowRating();

      const warnRes = await issueProductWarning(product._id, adminTok, 'Store count test');
      expect(warnRes.status).toBe(200);

      let prodStatus = await getProductStatus(product._id, adminTok);
      expect(prodStatus.body.data.storedWarningCount).toBe(1);
      expect(prodStatus.body.data.warningCount).toBe(1);

      await Product.updateOne(
        { _id: product._id },
        { $set: { lastProductWarningAt: daysAgo(7) } }
      );

      prodStatus = await getProductStatus(product._id, adminTok);
      expect(prodStatus.body.data.storedWarningCount).toBe(1); // preserved
      expect(prodStatus.body.data.warningCount).toBe(0); // effective = 0
    });
  });

  describe('rating recovery reset', () => {
    it('lowRatingStatus resets when average rating returns to threshold', async () => {
      const { product, sellerOrder, adminTok } = await setupProductWithLowRating();

      let prodStatus = await getProductStatus(product._id, adminTok);
      expect(prodStatus.body.data.lowRatingStatus).toBe(true);

      // Add 5-star reviews to lift the average above the threshold.
      const orderCustomer = await createCustomer();
      const parentOrder = await ParentOrder.create({
        customer: orderCustomer._id,
        orderStatus: 'Delivered',
        shippingFullName: orderCustomer.name,
        shippingPhone: '03001234567',
        shippingAddressLine1: 'Main Street',
        shippingCity: 'Lahore',
        shippingState: 'Punjab',
        shippingPostalCode: '54000',
        totalAmount: product.price * 2,
      });

      const newSellerOrder = await SellerOrder.create({
        parentOrder: parentOrder._id,
        store: product.store,
        subTotal: product.price * 2,
        status: 'Delivered',
        items: [
          {
            product: product._id,
            productNameSnapshot: product.name,
            unitPriceSnapshot: product.price,
            quantity: 2,
          },
        ],
      });

      // Add 5-star reviews
      for (let i = 0; i < 2; i++) {
        const customer = await createCustomer();
        await Review.create({
          customer: customer._id,
          product: product._id,
          sellerOrder: newSellerOrder._id,
          rating: 5,
        });
      }

      prodStatus = await getProductStatus(product._id, adminTok);
      // avg = (1+1+5+5)/4 = 3.0 → not below threshold → lowRatingStatus false.
      expect(prodStatus.body.data.lowRatingStatus).toBe(false);
    });
  });

  describe('seller suspension/reinstatement resets warning count', () => {
    it('seller profile warningCount resets to 0 after reinstatement (D5)', async () => {
      const { profile, adminTok } = await setupSellerWithLowRating();

      const warn1 = await issueSellerWarning(profile._id, adminTok, 'Warning 1');
      expect(warn1.status).toBe(200);
      const warn2 = await issueSellerWarning(profile._id, adminTok, 'Warning 2');
      expect(warn2.status).toBe(200);

      let status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.storedWarningCount).toBe(2);

      await request(app)
        .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
        .set('Authorization', `Bearer ${adminTok}`)
        .send({ reason: 'Low rating' })
        .expect(200);

      await request(app)
        .post(`/api/v1/admin/sellers/${profile._id}/reinstate`)
        .set('Authorization', `Bearer ${adminTok}`)
        .expect(200);

      status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.storedWarningCount).toBe(0); // reset per D5
      expect(status.body.data.warningHistory).toBeDefined();
      expect(status.body.data.warningHistory.length).toBeGreaterThan(0); // preserved
      expect(status.body.data.lowRatingStatus).toBe(true);
    });
  });

  describe('product suspension/republish resets warning count', () => {
    it('product warningCount is cleared on explicit republish (D5)', async () => {
      const { seller, profile, store, product, adminTok } = await setupProductWithLowRating();

      const warnRes = await issueProductWarning(product._id, adminTok, 'First warn');
      expect(warnRes.status).toBe(200);

      let prodStatus = await getProductStatus(product._id, adminTok);
      expect(prodStatus.body.data.warningCount).toBe(1);

      // Suspend seller → bulk transition product to Suspended.
      await request(app)
        .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
        .set('Authorization', `Bearer ${adminTok}`)
        .send({ reason: 'Low rating' })
        .expect(200);

      const suspendedProduct = await Product.findById(product._id).lean();
      expect(suspendedProduct.status).toBe('Suspended');

      // Reinstate the seller so the seller is no longer blocked.
      await request(app)
        .post(`/api/v1/admin/sellers/${profile._id}/reinstate`)
        .set('Authorization', `Bearer ${adminTok}`)
        .expect(200);

      const sellerToken = generateTestToken({ sub: seller._id.toString(), roles: ['Seller'], permissions: ['Seller.Products.Edit'] });

      // Explicit republish (PUT) moves Suspended → Approved and resets warnings.
      const republishRes = await request(app)
        .put(`/api/v1/seller/products/${product._id}/republish`)
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(republishRes.status).toBe(200);

      const afterRepublish = await Product.findById(product._id).lean();
      expect(afterRepublish.status).toBe('PendingApproval');
      expect(afterRepublish.warningCount).toBe(0); // reset on republish (D5)
    });
  });

  describe('warning history remains preserved', () => {
    it('seller warningHistory preserved across decay and reinstatement', async () => {
      const { profile, adminTok } = await setupSellerWithLowRating();

      const warn1 = await issueSellerWarning(profile._id, adminTok, 'Warning A');
      expect(warn1.status).toBe(200);
      const warn2 = await issueSellerWarning(profile._id, adminTok, 'Warning B');
      expect(warn2.status).toBe(200);

      let status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.warningHistory).toHaveLength(2);

      await SellerProfile.updateOne(
        { _id: profile._id },
        { $set: { lastSellerWarningAt: daysAgo(7) } }
      );

      status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.warningCount).toBe(0);
      expect(status.body.data.warningHistory).toHaveLength(2); // preserved

      // Suspend before reinstatement (reinstate requires an active suspension).
      await request(app)
        .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
        .set('Authorization', `Bearer ${adminTok}`)
        .send({ reason: 'Low rating' })
        .expect(200);

      await request(app)
        .post(`/api/v1/admin/sellers/${profile._id}/reinstate`)
        .set('Authorization', `Bearer ${adminTok}`)
        .expect(200);

      status = await getSellerStatus(profile._id, adminTok);
      expect(status.body.data.warningHistory).toHaveLength(2); // still preserved
      expect(status.body.data.storedWarningCount).toBe(0); // reset
    });
  });
});
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';
import Product from '../app/models/Product.model.js';
import ParentOrder from '../app/models/ParentOrder.model.js';
import SellerOrder from '../app/models/SellerOrder.model.js';
import Review from '../app/models/Review.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'review') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const createCustomer = async () => {
  const customer = await User.create({
    name: 'Review Customer',
    email: uniqueEmail('customer'),
    password: 'password123',
    role: 'Customer',
    emailVerified: true,
  });
  const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });
  return { customer, token };
};

const seedStoreProduct = async () => {
  const n = nextUid();
  const seller = await User.create({
    name: `Seller ${n}`,
    email: uniqueEmail('seller'),
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
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
  const product = await Product.create({
    name: `Product ${n}`,
    description: 'A product',
    price: 100,
    stock: 10,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
  });
  return { store, product };
};

const createParentOrder = (customerId, overrides = {}) =>
  ParentOrder.create({
    customer: customerId,
    orderStatus: 'Delivered',
    shippingFullName: 'John Doe',
    shippingPhone: '03451234567',
    shippingAddressLine1: 'Main St',
    shippingCity: 'Lahore',
    totalAmount: 100,
    ...overrides,
  });

const createSellerOrder = (parentId, store, product, overrides = {}) =>
  SellerOrder.create({
    parentOrder: parentId,
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
    ...overrides,
  });

// Full context for a reviewable, delivered order item.
const seedReviewContext = async ({ status = 'Delivered' } = {}) => {
  const { customer, token } = await createCustomer();
  const { store, product } = await seedStoreProduct();
  const parent = await createParentOrder(customer._id);
  const sellerOrder = await createSellerOrder(parent._id, store, product, { status });
  return { customer, token, store, product, parent, sellerOrder };
};

describe('Reviews API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/v1/reviews', () => {
    it('creates a review for a delivered order item', async () => {
      const { token, product, sellerOrder } = await seedReviewContext();

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 5,
          comment: 'Great product',
        })
        .expect(201);

      expect(res.body.message).toBe('Review created');
      expect(res.body.data.rating).toBe(5);

      const dbReview = await Review.findOne({ product: product._id }).lean();
      expect(dbReview.comment).toBe('Great product');
    });

    it('returns 404 for an unknown seller order', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: new mongoose.Types.ObjectId().toString(),
          sellerOrderId: new mongoose.Types.ObjectId().toString(),
          rating: 5,
        })
        .expect(404);

      expect(res.body.message).toBe('Seller order not found');
    });

    it('returns 404 when the order is not the reviewer\'s', async () => {
      const { product, sellerOrder } = await seedReviewContext();
      const { token: otherToken } = await createCustomer();

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          productId: product._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 5,
        })
        .expect(404);

      expect(res.body.message).toBe('Order not found or not yours');
    });

    it('rejects reviewing an item that has not been delivered (400)', async () => {
      const { token, product, sellerOrder } = await seedReviewContext({ status: 'Processing' });

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 5,
        })
        .expect(400);

      expect(res.body.message).toBe('You can only review delivered items');
    });

    it('rejects reviewing a product that is not part of the order (400)', async () => {
      const { token, sellerOrder } = await seedReviewContext();
      const { product: otherProduct } = await seedStoreProduct();

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: otherProduct._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 5,
        })
        .expect(400);

      expect(res.body.message).toBe('Product not found in this order');
    });

    it('rejects a duplicate review with 409', async () => {
      const { token, product, sellerOrder } = await seedReviewContext();
      const payload = {
        productId: product._id.toString(),
        sellerOrderId: sellerOrder._id.toString(),
        rating: 4,
      };

      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(201);

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(409);

      expect(res.body.message).toBe('You have already reviewed this item');
    });

    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .send({ rating: 5 })
        .expect(401);
      expect(res.body.message).toBe('Authentication required');
    });
  });

  describe('GET /api/v1/reviews/product/:productId (public)', () => {
    it('returns the reviews for a product', async () => {
      const { token, product, sellerOrder } = await seedReviewContext();
      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 5,
        })
        .expect(201);

      const res = await request(app)
        .get(`/api/v1/reviews/product/${product._id}`)
        .expect(200);

      expect(res.body.message).toBe('Product reviews retrieved');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBe(1);
    });
  });

  describe('GET /api/v1/reviews/mine', () => {
    it('returns only the authenticated customer reviews', async () => {
      const { token, product, sellerOrder } = await seedReviewContext();
      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 5,
        })
        .expect(201);

      const res = await request(app)
        .get('/api/v1/reviews/mine')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('My reviews retrieved');
      expect(res.body.data.total).toBe(1);
    });

    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app).get('/api/v1/reviews/mine').expect(401);
      expect(res.body.message).toBe('Authentication required');
    });
  });

  describe('GET /api/v1/reviews/:id', () => {
    it('returns a single review by id', async () => {
      const { token, product, sellerOrder } = await seedReviewContext();
      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 5,
        })
        .expect(201);

      const reviewId = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/v1/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Review retrieved');
      expect(res.body.data._id).toBe(reviewId);
    });

    it('returns 404 for an unknown review id', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .get(`/api/v1/reviews/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Review not found');
    });
  });

  // -------------------------------------------------------------------
  // M-018 — Review IDOR / ownership exposure regression
  // -------------------------------------------------------------------
  describe('GET /api/v1/reviews/:id (M-018 ownership check)', () => {
    it('rejects cross-user access (another customer cannot read it)', async () => {
      const { token, product, sellerOrder } = await seedReviewContext();
      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 5,
        })
        .expect(201);

      const reviewId = createRes.body.data._id;

      // A different authenticated customer must not retrieve the review.
      const { token: otherToken } = await createCustomer();

      const res = await request(app)
        .get(`/api/v1/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(res.body.message).toBe('Review not found');
    });

    it('still allows the author to read their own review', async () => {
      const { token, product, sellerOrder } = await seedReviewContext();
      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 4,
          comment: 'Good',
        })
        .expect(201);

      const reviewId = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/v1/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data._id).toBe(reviewId);
    });

    it('does not break public product reviews (no token required)', async () => {
      const { token, product, sellerOrder } = await seedReviewContext();
      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 5,
        })
        .expect(201);

      const res = await request(app)
        .get(`/api/v1/reviews/product/${product._id}`)
        .expect(200);

      expect(res.body.data.total).toBe(1);
    });
  });

  // -------------------------------------------------------------------
  // Anonymous Reviews & Multi-Product Seller Order Tests
  // -------------------------------------------------------------------
  describe('Anonymous reviews & Multi-product reviews', () => {
    it('creates an anonymous review and hides reviewer identity in public product reviews', async () => {
      const { token, product, sellerOrder, customer } = await seedReviewContext();

      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 5,
          comment: 'Anonymous feedback',
          isAnonymous: true,
        })
        .expect(201);

      expect(createRes.body.data.isAnonymous).toBe(true);

      // Public product reviews must sanitize the customer name and not leak real customer name or ID
      const publicRes = await request(app)
        .get(`/api/v1/reviews/product/${product._id}`)
        .expect(200);

      const items = publicRes.body.data.items;
      expect(items.length).toBe(1);
      expect(items[0].isAnonymous).toBe(true);
      expect(items[0].customer.name).toBe('Anonymous Customer');
      expect(items[0].customer._id).toBeUndefined();
      expect(items[0].customer.email).toBeUndefined();

      // Author can still fetch their own reviews and see it was submitted anonymously
      const myRes = await request(app)
        .get('/api/v1/reviews/mine')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const myItems = myRes.body.data.items;
      expect(myItems.length).toBe(1);
      expect(myItems[0].isAnonymous).toBe(true);
    });

    it('allows reviewing separate products in the same multi-product seller order independently', async () => {
      const { customer, token } = await createCustomer();
      const { store, product: productA } = await seedStoreProduct();

      // Create a second product in the same store
      const productB = await Product.create({
        name: 'Product B',
        description: 'Second product',
        price: 150,
        stock: 10,
        store: store._id,
        category: new mongoose.Types.ObjectId(),
        subCategory: new mongoose.Types.ObjectId(),
        status: 'Approved',
      });

      const parent = await createParentOrder(customer._id);
      const sellerOrder = await SellerOrder.create({
        parentOrder: parent._id,
        store: store._id,
        subTotal: 250,
        status: 'Delivered',
        items: [
          {
            product: productA._id,
            productNameSnapshot: productA.name,
            unitPriceSnapshot: productA.price,
            quantity: 1,
          },
          {
            product: productB._id,
            productNameSnapshot: productB.name,
            unitPriceSnapshot: productB.price,
            quantity: 2,
          },
        ],
      });

      // Review Product A
      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: productA._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 4,
          comment: 'Product A review',
        })
        .expect(201);

      // Review Product B
      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: productB._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 5,
          comment: 'Product B review',
        })
        .expect(201);

      // Duplicate review on Product A is rejected
      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: productA._id.toString(),
          sellerOrderId: sellerOrder._id.toString(),
          rating: 3,
        })
        .expect(409);
    });
  });
});

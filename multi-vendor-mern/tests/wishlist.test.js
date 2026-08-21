import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';
import Product from '../app/models/Product.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'wish') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const createCustomer = async () => {
  const customer = await User.create({
    name: 'Wish Customer',
    email: uniqueEmail('customer'),
    password: 'password123',
    role: 'Customer',
    emailVerified: true,
  });
  const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });
  return { customer, token };
};

// An Approved product from an approved seller with an active store (passes findPublicById).
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
    isActive: true,
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
  return { product };
};

describe('Wishlist API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('GET /api/v1/wishlist', () => {
    it('returns an (auto-created) empty wishlist on first access', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .get('/api/v1/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Wishlist retrieved');
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.products).toHaveLength(0);
    });

    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app).get('/api/v1/wishlist').expect(401);
      expect(res.body.message).toBe('Authentication required');
    });
  });

  describe('POST /api/v1/wishlist/items', () => {
    it('adds a product to the wishlist', async () => {
      const { token } = await createCustomer();
      const { product } = await seedStoreProduct();

      const res = await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id.toString() })
        .expect(200);

      expect(res.body.message).toBe('Product added to wishlist');
      expect(res.body.data.products.map(String)).toContain(product._id.toString());
    });

    it('does not add the same product twice', async () => {
      const { token } = await createCustomer();
      const { product } = await seedStoreProduct();
      const payload = { productId: product._id.toString() };

      await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(200);

      const res = await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(200);

      const ids = res.body.data.products.map(String).filter((id) => id === product._id.toString());
      expect(ids).toHaveLength(1);
    });

    it('returns 404 when adding an unknown product', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: new mongoose.Types.ObjectId().toString() })
        .expect(404);

      expect(res.body.message).toBe('Product not found');
    });
  });

  describe('DELETE /api/v1/wishlist/items', () => {
    it('removes a product from the wishlist', async () => {
      const { token } = await createCustomer();
      const { product } = await seedStoreProduct();
      await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id.toString() })
        .expect(200);

      const res = await request(app)
        .delete('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id.toString() })
        .expect(200);

      expect(res.body.message).toBe('Product removed from wishlist');
      expect(res.body.data.products.map(String)).not.toContain(product._id.toString());
    });

    it('returns 404 when removing from a non-existent wishlist', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .delete('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: new mongoose.Types.ObjectId().toString() })
        .expect(404);

      expect(res.body.message).toBe('Wishlist not found');
    });
  });

  describe('DELETE /api/v1/wishlist', () => {
    it('clears the wishlist', async () => {
      const { token } = await createCustomer();
      const { product } = await seedStoreProduct();
      await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id.toString() })
        .expect(200);

      const res = await request(app)
        .delete('/api/v1/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Wishlist cleared');
      expect(res.body.data.products).toHaveLength(0);
    });

    it('returns 404 when clearing a non-existent wishlist', async () => {
      const { token } = await createCustomer();

      const res = await request(app)
        .delete('/api/v1/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Wishlist not found');
    });
  });
});

import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';
import Product from '../app/models/Product.model.js';

/**
 * M-019 — Pagination safety (public catalog surface).
 *
 * page/pageSize are validated and bounded: malformed (abc), negative, and zero
 * values fall back to a sane default; absurdly large pageSize values are capped.
 */

const seedPublicCatalog = async (count = 15) => {
  const seller = await User.create({
    name: 'M019 Seller',
    email: `m019-seller-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'M019 Business',
    taxId: 'TAX-019',
    phone: '03001234567',
    address: 'Lahore',
  });
  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'M019 Store',
    description: 'A store',
    city: 'Lahore',
  });

  const products = [];
  for (let i = 0; i < count; i += 1) {
    products.push({
      name: `M019 Product ${i}`,
      description: 'Test',
      price: 100 + i,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });
  }
  await Product.insertMany(products);
  return { store };
};

describe('M-019 — Pagination boundaries', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('defaults pageSize to 12 for missing/malformed/zero/negative values', async () => {
    await seedPublicCatalog(15);

    for (const pageSize of [undefined, 0, -1, 'abc']) {
      const params = pageSize === undefined ? {} : { pageSize };
      const res = await request(app).get('/api/v1/products').query(params).expect(200);
      expect(res.body.data.pageSize).toBe(12);
    }
  });

  it('caps an absurd pageSize at the configured maximum (100)', async () => {
    await seedPublicCatalog(15);
    const res = await request(app).get('/api/v1/products').query({ pageSize: 999999 }).expect(200);
    expect(res.body.data.pageSize).toBe(100);
  });

  it('normalizes negative/zero/malformed page to 1', async () => {
    await seedPublicCatalog(15);
    for (const page of [-5, 0, 'abc']) {
      const res = await request(app).get('/api/v1/products').query({ page }).expect(200);
      expect(res.body.data.page).toBe(1);
    }
  });

  it('returns persisted products for default pagination', async () => {
    await seedPublicCatalog(15);
    const res = await request(app).get('/api/v1/products').expect(200);
    expect(res.body.data.items.length).toBe(12);
    expect(res.body.data.total).toBe(15);
  });
});
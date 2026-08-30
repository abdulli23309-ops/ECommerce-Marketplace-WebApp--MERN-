import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import SellerProfile from '../../app/models/SellerProfile.model.js';
import Store from '../../app/models/Store.model.js';
import Product from '../../app/models/Product.model.js';

const createSeller = async ({ suffix = '' } = {}) => {
  const seller = await User.create({
    name: 'Reads Test Seller',
    email: `reads-${suffix}-${Date.now()}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Reads Business',
    taxId: 'TAX-READS',
    phone: '03001234567',
    address: 'Lahore',
  });
  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Reads Store',
    description: 'A store',
    city: 'Lahore',
  });
  const token = generateTestToken({
    sub: seller._id.toString(),
    roles: ['Seller'],
    permissions: ['Seller.Products.Edit'],
  });
  return { seller, profile, store, token };
};

const seedProduct = (store, { name, status = 'Approved' } = {}) =>
  Product.create({
    name,
    description: 'A product',
    price: 100,
    stock: 5,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status,
  });

const adminToken = async () => {
  const admin = await User.create({
    name: 'Reads Admin',
    email: `reads-admin-${Date.now()}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Admin',
  });
  return generateTestToken({ sub: admin._id.toString(), roles: ['Admin'] });
};

const suspendSeller = async (profileId, token) =>
  request(app)
    .post(`/api/v1/admin/sellers/${profileId}/suspend`)
    .set('Authorization', `Bearer ${token}`)
    .send({ reason: 'Low rating' })
    .expect(200);

describe('Priority 5 — Suspended seller read access (M-011)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('suspended seller can view their own product detail (200)', async () => {
    const { profile, store, token } = await createSeller();
    const product = await seedProduct(store, { name: 'My Visible Product' });
    await suspendSeller(profile._id, await adminToken());

    const res = await request(app)
      .get(`/api/v1/seller/products/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.message).toBe('Product retrieved');
    expect(res.body.data.name).toBe('My Visible Product');
    expect(res.body.data._id).toBe(product._id.toString());
  });

  it('suspended seller can list their own products (200)', async () => {
    const { profile, store, token } = await createSeller();
    await seedProduct(store, { name: 'Listed Product' });
    await suspendSeller(profile._id, await adminToken());

    const res = await request(app)
      .get('/api/v1/seller/products')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0].name).toBe('Listed Product');
  });

  it('suspended seller cannot view another store product (ownership intact → 404)', async () => {
    const { profile, token } = await createSeller({ suffix: 'a' });
    const other = await createSeller({ suffix: 'b' });
    const otherProduct = await seedProduct(other.store, { name: 'Not Yours' });
    await suspendSeller(profile._id, await adminToken());

    const res = await request(app)
      .get(`/api/v1/seller/products/${otherProduct._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body.message).toBe('Product not found');
  });

  it('suspended seller still cannot perform restricted product writes (republish → 403)', async () => {
    const { profile, store, token } = await createSeller();
    const product = await seedProduct(store, { name: 'Write Blocked', status: 'Suspended' });
    await suspendSeller(profile._id, await adminToken());

    const res = await request(app)
      .put(`/api/v1/seller/products/${product._id}/republish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    // The 403 must come from the suspension gate, not from missing permissions.
    expect(res.body.message).toBe(
      'Your seller account is suspended and cannot create new marketplace activity'
    );
  });

  it('suspended seller can view their orders (200)', async () => {
    const { profile, token } = await createSeller();
    await suspendSeller(profile._id, await adminToken());

    const res = await request(app)
      .get('/api/v1/seller/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.items).toEqual([]);
  });

  it('suspended seller can view their reviews (200)', async () => {
    const { profile, token } = await createSeller();
    await suspendSeller(profile._id, await adminToken());

    const res = await request(app)
      .get('/api/v1/seller/reviews')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.items).toEqual([]);
  });

  it('suspended seller can view their profile (200)', async () => {
    const { profile, token } = await createSeller();
    await suspendSeller(profile._id, await adminToken());

    const res = await request(app)
      .get('/api/v1/seller/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.status).toBe('Suspended');
  });

  it('suspended seller dashboard remains blocked (403)', async () => {
    const { profile, token } = await createSeller();
    await suspendSeller(profile._id, await adminToken());

    const res = await request(app)
      .get('/api/v1/seller/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(res.body.message).toBe('Your seller account is suspended');
  });
});

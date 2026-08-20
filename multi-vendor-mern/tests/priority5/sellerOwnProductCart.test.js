import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import SellerProfile from '../../app/models/SellerProfile.model.js';
import Store from '../../app/models/Store.model.js';
import Product from '../../app/models/Product.model.js';

describe('Priority 5.11 — Seller Own-Product Cart Restriction', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('rejects seller adding their own product to cart via API', async () => {
    const seller = await User.create({
      name: 'Seller Owner',
      email: `seller-owner-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const profile = await SellerProfile.create({
      user: seller._id,
      status: 'Approved',
      businessName: 'Seller Own Store',
      taxId: '123',
      phone: '03001234567',
      address: 'Lahore',
    });

    const store = await Store.create({
      sellerProfile: profile._id,
      name: 'Seller Own Store',
      description: 'Store',
      city: 'Lahore',
    });

    const product = await Product.create({
      name: 'Own Product',
      description: 'Own product',
      price: 500,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    const token = generateTestToken({
      sub: seller._id.toString(),
      roles: ['Seller'],
    });

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 1 })
      .expect(400);

    expect(res.body.message).toContain('own product');
  });

  it('allows seller to add another seller product', async () => {
    const sellerA = await User.create({
      name: 'Seller A',
      email: `seller-a-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const sellerB = await User.create({
      name: 'Seller B',
      email: `seller-b-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const profileA = await SellerProfile.create({
      user: sellerA._id,
      status: 'Approved',
      businessName: 'Seller A Store',
      taxId: '123',
      phone: '03001234567',
      address: 'Lahore',
    });

    const profileB = await SellerProfile.create({
      user: sellerB._id,
      status: 'Approved',
      businessName: 'Seller B Store',
      taxId: '456',
      phone: '03001234567',
      address: 'Karachi',
    });

    const storeA = await Store.create({
      sellerProfile: profileA._id,
      name: 'Seller A Store',
      description: 'Store A',
      city: 'Lahore',
    });

    const storeB = await Store.create({
      sellerProfile: profileB._id,
      name: 'Seller B Store',
      description: 'Store B',
      city: 'Karachi',
    });

    const productB = await Product.create({
      name: 'Seller B Product',
      description: 'Product B',
      price: 300,
      stock: 10,
      store: storeB._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    const tokenA = generateTestToken({
      sub: sellerA._id.toString(),
      roles: ['Seller'],
    });

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ productId: productB._id.toString(), quantity: 1 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);
  });
});
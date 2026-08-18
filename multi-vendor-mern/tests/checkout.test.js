import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import Address from '../app/models/Address.model.js';
import Store from '../app/models/Store.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Product from '../app/models/Product.model.js';
import Cart from '../app/models/Cart.model.js';

const seedCheckoutData = async ({ stock = 10 } = {}) => {
  const customer = await User.create({
    name: 'Test Customer',
    email: `customer-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Customer',
  });

  const seller = await User.create({
    name: 'Test Seller',
    email: `seller-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Seller',
  });

  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Test Business',
    taxId: '1234567',
    phone: '03001234567',
    address: 'Test Address',
  });

  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Test Store',
    description: 'Test store',
    city: 'Lahore',
  });

  const product = await Product.create({
    name: 'Test Product',
    description: 'Test description',
    price: 100,
    stock,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
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

  return { customer, address, product };
};

describe('Checkout API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('creates an order with real address fullName/phoneNumber', async () => {
    const { customer, address, product } = await seedCheckoutData({ stock: 10 });

    await Cart.create({
      user: customer._id,
      items: [
        {
          product: product._id,
          price: 100,
          quantity: 2,
        },
      ],
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString() })
      .expect(201);

    expect(res.body.data.shippingFullName).toBe('John Doe');
    expect(res.body.data.shippingPhone).toBe('03451234567');
    expect(res.body.data.totalAmount).toBe(200);
  });

  it('rejects checkout when cart is empty', async () => {
    const { customer, address } = await seedCheckoutData({ stock: 10 });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString() })
      .expect(400);

    expect(res.body.message).toBe('Cart is empty');
  });

  it('rejects checkout when stock is insufficient', async () => {
    const { customer, address, product } = await seedCheckoutData({ stock: 0 });

    await Cart.create({
      user: customer._id,
      items: [
        {
          product: product._id,
          price: 100,
          quantity: 1,
        },
      ],
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString() })
      .expect(400);

    expect(res.body.message).toContain('Insufficient stock');
  });
});
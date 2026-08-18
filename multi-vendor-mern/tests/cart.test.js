import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import Store from '../app/models/Store.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Product from '../app/models/Product.model.js';

const seedCartData = async ({ stock = 10 } = {}) => {
  const customer = await User.create({
    name: 'Cart Customer',
    email: `cart-customer-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Customer',
  });

  const seller = await User.create({
    name: 'Cart Seller',
    email: `cart-seller-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Seller',
  });

  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Cart Store',
    taxId: '1234567',
    phone: '03001234567',
    address: 'Lahore',
  });

  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Cart Store',
    description: 'Cart test store',
    city: 'Lahore',
  });

  const product = await Product.create({
    name: 'Cart Product',
    description: 'Cart product description',
    price: 150,
    stock,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
  });

  const token = generateTestToken({
    sub: customer._id.toString(),
    roles: ['Customer'],
  });

  return { customer, product, token };
};

const findItem = (cart, productId) =>
  cart.items.find((item) => {
    const itemProductId =
      typeof item.product === 'object' && item.product
        ? item.product._id
        : item.product;

    return itemProductId.toString() === productId.toString();
  });

describe('Cart stock validation API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('adds an item when quantity is within available stock', async () => {
    const { product, token } = await seedCartData({ stock: 10 });

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 3 })
      .expect(200);

    const item = findItem(res.body.data, product._id);

    expect(item).toBeTruthy();
    expect(item.quantity).toBe(3);
  });

  it('rejects adding a quantity greater than available stock', async () => {
    const { product, token } = await seedCartData({ stock: 5 });

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 6 })
      .expect(400);

    expect(res.body.message).toContain('Insufficient stock');
  });

  it('combines quantities correctly when adding an existing item', async () => {
    const { product, token } = await seedCartData({ stock: 10 });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 3 })
      .expect(200);

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 4 })
      .expect(200);

    const item = findItem(res.body.data, product._id);

    expect(item).toBeTruthy();
    expect(item.quantity).toBe(7);
  });

  it('rejects adding an existing item when combined quantity exceeds stock', async () => {
    const { product, token } = await seedCartData({ stock: 6 });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 4 })
      .expect(200);

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 3 })
      .expect(400);

    expect(res.body.message).toContain('Insufficient stock');
  });

  it('updates item quantity to a valid value', async () => {
    const { product, token } = await seedCartData({ stock: 10 });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 2 })
      .expect(200);

    const res = await request(app)
      .put('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 5 })
      .expect(200);

    const item = findItem(res.body.data, product._id);

    expect(item).toBeTruthy();
    expect(item.quantity).toBe(5);
  });

  it('rejects updating item quantity above available stock', async () => {
    const { product, token } = await seedCartData({ stock: 4 });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 1 })
      .expect(200);

    const res = await request(app)
      .put('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 5 })
      .expect(400);

    expect(res.body.message).toContain('Insufficient stock');
  });

  it('rejects adding a non-existent or unapproved product', async () => {
    const { token } = await seedCartData({ stock: 10 });
    const fakeProductId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: fakeProductId.toString(), quantity: 1 })
      .expect(404);

    expect(res.body.message).toContain('Product not found');
  });
});
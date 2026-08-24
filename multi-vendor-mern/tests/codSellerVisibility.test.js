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
import Payment from '../app/models/Payment.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix) => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

// Build a seller (approved profile + store + product) and return a Seller token.
const seedSeller = async () => {
  const n = nextUid();
  const seller = await User.create({
    name: `COD Seller ${n}`,
    email: uniqueEmail('cod-seller'),
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: `COD Business ${n}`,
    taxId: `TAX-${n}`,
    phone: '03001234567',
    address: 'Lahore',
  });
  const store = await Store.create({
    sellerProfile: profile._id,
    name: `COD Store ${n}`,
    description: 'A store',
    city: 'Lahore',
  });
  const product = await Product.create({
    name: `COD Product ${n}`,
    description: 'A product',
    price: 100,
    stock: 10,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
  });
  const token = generateTestToken({ sub: seller._id.toString(), roles: ['Seller'] });
  return { seller, store, product, token };
};

const createCustomer = () =>
  User.create({
    name: 'COD Customer',
    email: uniqueEmail('cod-customer'),
    password: 'password123',
    role: 'Customer',
    emailVerified: true,
  });

// Create a parent order + seller order + payment for the given store.
const seedOrder = async ({ customer, store, product, method, status }) => {
  const parentOrder = await ParentOrder.create({
    customer: customer._id,
    orderStatus: 'Pending',
    shippingFullName: 'John Doe',
    shippingPhone: '03451234567',
    shippingAddressLine1: 'Main St',
    shippingCity: 'Lahore',
    shippingState: 'Punjab',
    shippingPostalCode: '54000',
    totalAmount: 200,
  });
  await SellerOrder.create({
    parentOrder: parentOrder._id,
    store: store._id,
    status: 'Pending',
    subTotal: 200,
    items: [
      {
        product: product._id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: product.price,
        quantity: 2,
      },
    ],
  });
  await Payment.create({
    parentOrder: parentOrder._id,
    amount: 200,
    method,
    status,
  });
  return parentOrder;
};

describe('Seller order visibility for Cash on Delivery', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('shows a COD order with a Pending payment to the seller', async () => {
    const { store, product, token } = await seedSeller();
    const customer = await createCustomer();
    await seedOrder({ customer, store, product, method: 'CashOnDelivery', status: 'Pending' });

    const res = await request(app)
      .get('/api/v1/seller/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].paymentMethod).toBe('CashOnDelivery');
    expect(res.body.data.items[0].paymentStatus).toBe('Pending');
  });

  it('hides a prepaid order whose payment failed (e.g. Stripe)', async () => {
    const { store, product, token } = await seedSeller();
    const customer = await createCustomer();
    await seedOrder({ customer, store, product, method: 'Stripe', status: 'Failed' });

    const res = await request(app)
      .get('/api/v1/seller/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.total).toBe(0);
    expect(res.body.data.items).toHaveLength(0);
  });

  it('still shows a settled prepaid order (Completed) to the seller', async () => {
    const { store, product, token } = await seedSeller();
    const customer = await createCustomer();
    await seedOrder({ customer, store, product, method: 'Stripe', status: 'Completed' });

    const res = await request(app)
      .get('/api/v1/seller/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].paymentStatus).toBe('Completed');
  });

  it('hides a wallet order whose payment failed (EasyPaisa/JazzCash)', async () => {
    const { store, product, token } = await seedSeller();
    const customer = await createCustomer();
    await seedOrder({ customer, store, product, method: 'EasyPaisa', status: 'Failed' });

    const res = await request(app)
      .get('/api/v1/seller/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.total).toBe(0);
    expect(res.body.data.items).toHaveLength(0);
  });

  it('shows a settled wallet order (Completed EasyPaisa) to the seller', async () => {
    const { store, product, token } = await seedSeller();
    const customer = await createCustomer();
    await seedOrder({ customer, store, product, method: 'EasyPaisa', status: 'Completed' });

    const res = await request(app)
      .get('/api/v1/seller/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].paymentStatus).toBe('Completed');
  });
});

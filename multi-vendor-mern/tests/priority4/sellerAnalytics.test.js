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

describe('Seller Analytics API (Priority 4)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('returns topSellingProducts and salesTrend in seller dashboard', async () => {
    const seller = await User.create({
      name: 'Analytics Seller',
      email: `analytics-seller-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const customer = await User.create({
      name: 'Analytics Customer',
      email: `analytics-customer-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    const profile = await SellerProfile.create({
      user: seller._id,
      status: 'Approved',
      businessName: 'Analytics Store',
      taxId: '1234567',
      phone: '03001234567',
      address: 'Lahore',
    });

    const store = await Store.create({
      sellerProfile: profile._id,
      name: 'Analytics Store',
      description: 'Analytics store',
      city: 'Lahore',
    });

    const product = await Product.create({
      name: 'Top Product',
      description: 'Best seller',
      price: 200,
      stock: 10,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    const parentOrder = await ParentOrder.create({
      customer: customer._id,
      orderStatus: 'Delivered',
      shippingFullName: 'Analytics Customer',
      shippingPhone: '03451234567',
      shippingAddressLine1: 'Main Street',
      shippingCity: 'Lahore',
      shippingState: 'Punjab',
      shippingPostalCode: '54000',
      totalAmount: 600,
    });

    await SellerOrder.create({
      parentOrder: parentOrder._id,
      store: store._id,
      status: 'Delivered',
      subTotal: 600,
      items: [
        {
          product: product._id,
          productNameSnapshot: 'Top Product',
          unitPriceSnapshot: 200,
          quantity: 3,
        },
      ],
      createdAt: new Date(),
    });

    const token = generateTestToken({
      sub: seller._id.toString(),
      roles: ['Seller'],
    });

    const res = await request(app)
      .get('/api/v1/seller/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.topSellingProducts)).toBe(true);
    expect(res.body.data.topSellingProducts.length).toBe(1);
    expect(res.body.data.topSellingProducts[0].name).toBe('Top Product');
    expect(res.body.data.topSellingProducts[0].quantitySold).toBe(3);

    expect(Array.isArray(res.body.data.salesTrend)).toBe(true);
    expect(res.body.data.salesTrend.length).toBe(7);
  });
});
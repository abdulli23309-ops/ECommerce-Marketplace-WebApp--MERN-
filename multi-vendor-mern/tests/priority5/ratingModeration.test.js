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
import Review from '../../app/models/Review.model.js';

const createCustomer = async (index) => {
  return User.create({
    name: `Customer ${index}`,
    email: `customer-rating-${Date.now()}-${index}@example.com`,
    password: 'password123',
    role: 'Customer',
  });
};

const createReview = async (customer, product, sellerOrder, rating) => {
  return Review.create({
    customer: customer._id,
    product: product._id,
    sellerOrder: sellerOrder._id,
    rating,
  });
};

describe('Priority 5 — Rating Moderation', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('seller low rating state clears when average returns to threshold', async () => {
    const admin = await User.create({
      name: 'Admin User',
      email: `admin-rating-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Admin',
    });

    const seller = await User.create({
      name: 'Rating Seller',
      email: `seller-rating-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const profile = await SellerProfile.create({
      user: seller._id,
      status: 'Approved',
      businessName: 'Rating Store',
      taxId: '123',
      phone: '03001234567',
      address: 'Lahore',
    });

    const store = await Store.create({
      sellerProfile: profile._id,
      name: 'Rating Store',
      description: 'Rating store',
      city: 'Lahore',
    });

    const product = await Product.create({
      name: 'Rating Product',
      description: 'Rating product',
      price: 100,
      stock: 10,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    const firstCustomer = await createCustomer(1);

    const parentOrder = await ParentOrder.create({
      customer: firstCustomer._id,
      orderStatus: 'Delivered',
      shippingFullName: firstCustomer.name,
      shippingPhone: '03451234567',
      shippingAddressLine1: 'Main Street',
      shippingCity: 'Lahore',
      shippingState: 'Punjab',
      shippingPostalCode: '54000',
      totalAmount: 100,
    });

    const sellerOrder = await SellerOrder.create({
      parentOrder: parentOrder._id,
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
    });

    // Create two low reviews using different customers to satisfy unique index
    const customer2 = await createCustomer(2);
    const customer3 = await createCustomer(3);

    await createReview(customer2, product, sellerOrder, 1);
    await createReview(customer3, product, sellerOrder, 1);

    const token = generateTestToken({
      sub: admin._id.toString(),
      roles: ['Admin'],
    });

    // Seller profile ID is profile._id, not seller._id
    const warnRes = await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/warn`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Low rating test' })
      .expect(200);

    expect(warnRes.body.data.warningCount).toBe(1);

    // Create high reviews using distinct customers to recover
    const highRatedCustomers = [];
    for (let i = 4; i <= 8; i++) {
      highRatedCustomers.push(await createCustomer(i));
    }

    for (const highCustomer of highRatedCustomers) {
      await createReview(highCustomer, product, sellerOrder, 5);
    }

    const statusRes = await request(app)
      .get(`/api/v1/admin/sellers/${profile._id}/moderation-status`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(statusRes.body.data.lowRatingStatus).toBe(false);
    expect(statusRes.body.data.warningCount).toBe(0);
  });
});
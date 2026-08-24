import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import Product from '../app/models/Product.model.js';
import Store from '../app/models/Store.model.js';
import Category from '../app/models/Category.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Review from '../app/models/Review.model.js';
import ParentOrder from '../app/models/ParentOrder.model.js';
import SellerOrder from '../app/models/SellerOrder.model.js';

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'modtest') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

describe('Admin Product List - Moderation State Refresh', () => {
  let adminToken;
  let sellerUser;
  let sellerProfile;
  let store;
  let category;
  let product;

  // Helper to create a customer and order for review creation
  const createReviewWithOrder = async (productId, storeId, rating, comment = 'Test review') => {
    const customer = await User.create({
      name: `Customer ${nextUid()}`,
      email: uniqueEmail('customer'),
      password: 'password123',
      role: 'Customer',
    });

    const parentOrder = await ParentOrder.create({
      customer: customer._id,
      orderStatus: 'Delivered',
      shippingFullName: customer.name,
      shippingPhone: '03451234567',
      shippingAddressLine1: 'Main Street',
      shippingCity: 'Lahore',
      shippingState: 'Punjab',
      shippingPostalCode: '54000',
      totalAmount: 100,
    });

    const sellerOrder = await SellerOrder.create({
      parentOrder: parentOrder._id,
      store: storeId,
      subTotal: 100,
      status: 'Delivered',
      items: [
        {
          product: productId,
          productNameSnapshot: 'Test Product',
          unitPriceSnapshot: 100,
          quantity: 1,
        },
      ],
    });

    await Review.create({
      customer: customer._id,
      product: productId,
      sellerOrder: sellerOrder._id,
      rating,
      comment,
    });
  };

  beforeEach(async () => {
    await cleanDb();

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: uniqueEmail('admin'),
      password: 'password123',
      role: 'Admin',
    });
    adminToken = generateTestToken({ sub: adminUser._id.toString(), roles: ['Admin'] });

    // Create seller user
    const n = nextUid();
    sellerUser = await User.create({
      name: `Seller ${n}`,
      email: uniqueEmail('seller'),
      password: 'password123',
      role: 'Seller',
    });

    sellerProfile = await SellerProfile.create({
      user: sellerUser._id,
      status: 'Approved',
      businessName: `Business ${n}`,
      taxId: `TAX-${n}`,
      phone: '03001234567',
      address: 'Lahore',
    });

    store = await Store.create({
      name: `Store ${n}`,
      description: 'Test Description',
      sellerProfile: sellerProfile._id,
      city: 'Lahore',
    });

    category = await Category.create({
      name: 'Electronics',
      description: 'Electronic items',
    });

    const subCategory = await mongoose.model('SubCategory').create({
      name: 'Phones',
      description: 'Mobile phones',
      category: category._id,
    });

    // Create product with intentionally stale moderation fields
    product = await Product.create({
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      stock: 10,
      category: category._id,
      subCategory: subCategory._id,
      store: store._id,
      images: ['test.jpg'],
      status: 'Approved',
      // Simulate stale data: stored fields say it's fine
      averageRating: 4.5,
      lowRatingStatus: false,
      warningCount: 0,
      warningHistory: [],
    });
  });

  test('Admin product list returns fresh lowRatingStatus=true when product has low reviews but stale stored fields', async () => {
    // Create low-rating reviews (actual current data)
    await createReviewWithOrder(product._id, store._id, 2, 'Poor quality');
    await createReviewWithOrder(product._id, store._id, 1, 'Terrible');
    await createReviewWithOrder(product._id, store._id, 2, 'Not good');

    // Actual average from reviews: (2 + 1 + 2) / 3 = 1.67 < 3.0 threshold
    // But stored Product.averageRating is still 4.5 (stale)

    // Fetch admin product list
    const res = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);

    const productInList = res.body.data.products[0];

    // The response should reflect CURRENT review data, not stale stored fields
    expect(productInList.averageRating).toBe(1.7); // (2+1+2)/3 rounded
    expect(productInList.lowRatingStatus).toBe(true); // Should be true because 1.7 < 3.0
  });

  test('Admin product list preserves warningCount and warningHistory', async () => {
    // Set up product with warning history
    await Product.findByIdAndUpdate(product._id, {
      averageRating: 2.5,
      lowRatingStatus: true,
      warningCount: 2,
      warningHistory: [
        {
          warnedBy: new mongoose.Types.ObjectId(),
          reason: 'First warning',
          warnedAt: new Date('2026-01-01'),
        },
        {
          warnedBy: new mongoose.Types.ObjectId(),
          reason: 'Second warning',
          warnedAt: new Date('2026-02-01'),
        },
      ],
    });

    // Create low reviews
    await createReviewWithOrder(product._id, store._id, 2, 'Poor');

    const res = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const productInList = res.body.data.products[0];

    // Warning data should be preserved
    expect(productInList.warningCount).toBe(2);
    expect(productInList.warningHistory).toHaveLength(2);
    expect(productInList.warningHistory[0].reason).toBe('First warning');
  });

  test('Admin product list shows lowRatingStatus=false when product recovers above threshold', async () => {
    // Product starts with stale low rating status
    await Product.findByIdAndUpdate(product._id, {
      averageRating: 2.5,
      lowRatingStatus: true,
      warningCount: 1,
    });

    // But current reviews are actually good
    await createReviewWithOrder(product._id, store._id, 5, 'Excellent');
    await createReviewWithOrder(product._id, store._id, 4, 'Good');
    await createReviewWithOrder(product._id, store._id, 5, 'Great');

    // Average: (5+4+5)/3 = 4.67 > 3.0 threshold

    const res = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const productInList = res.body.data.products[0];

    expect(productInList.averageRating).toBe(4.7); // rounded
    expect(productInList.lowRatingStatus).toBe(false); // Should be false now
    expect(productInList.warningCount).toBe(1); // Warning count preserved
  });
});

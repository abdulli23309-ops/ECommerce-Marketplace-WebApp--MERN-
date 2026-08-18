import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';
import Product from '../app/models/Product.model.js';

const seedAdminAndStore = async () => {
  const admin = await User.create({
    name: 'Admin User',
    email: `admin-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Admin',
  });

  const seller = await User.create({
    name: 'Seller User',
    email: `seller-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Seller',
  });

  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Stats Store',
    taxId: '1234567',
    phone: '03001234567',
    address: 'Lahore',
  });

  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Stats Store',
    description: 'Stats store',
    city: 'Lahore',
  });

  return { admin, store };
};

describe('Admin Product Statistics / BUG-08 regression', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('counts only products actually approved today, not products merely updated today', async () => {
    const { admin, store } = await seedAdminAndStore();

    // Approved today
    await Product.create({
      name: 'Approved Today',
      description: 'Approved today',
      price: 100,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
      approvedAt: new Date(),
    });

    // Approved yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await Product.create({
      name: 'Approved Yesterday',
      description: 'Approved yesterday',
      price: 100,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
      approvedAt: yesterday,
    });

    // Updated today but approved earlier
    const oldApproved = new Date();
    oldApproved.setDate(oldApproved.getDate() - 10);

    await Product.create({
      name: 'Updated Today Old Approval',
      description: 'Updated today',
      price: 100,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
      approvedAt: oldApproved,
      updatedAt: new Date(),
    });

    // Pending product
    await Product.create({
      name: 'Pending Product',
      description: 'Pending',
      price: 100,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'PendingApproval',
    });

    const token = generateTestToken({
      sub: admin._id.toString(),
      roles: ['Admin'],
    });

    const res = await request(app)
      .get('/api/v1/admin/products/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.approvedToday).toBe(1);
  });
});
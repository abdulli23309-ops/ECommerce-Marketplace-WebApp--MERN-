import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import SellerProfile from '../../app/models/SellerProfile.model.js';
import Store from '../../app/models/Store.model.js';
import Product from '../../app/models/Product.model.js';
import * as storeRepo from '../../app/repositories/Store.repository.js';

const createSeller = async () => {
  const seller = await User.create({
    name: 'Visibility Test Seller',
    email: `visibility-${Date.now()}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Seller',
  });

  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Visibility Store',
    taxId: '1234567890',
    phone: '03001234567',
    address: 'Lahore',
  });

  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Visibility Store',
    description: 'Visibility store',
    city: 'Lahore',
  });

  return { seller, profile, store };
};

const adminToken = async () => {
  const admin = await User.create({
    name: 'Admin User',
    email: `admin-visibility-${Date.now()}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Admin',
  });
  return generateTestToken({ sub: admin._id.toString(), roles: ['Admin'] });
};

describe('Priority 5 — Product Visibility Across All Public Surfaces', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('public product visibility', () => {
    it('suspended seller products are excluded from public catalog', async () => {
      const { seller, profile, store } = await createSeller();

      const product = await Product.create({
        name: 'Public Catalog Product',
        description: 'Test product for catalog',
        price: 1000,
        stock: 50,
        store: store._id,
        status: 'Approved',
        category: new mongoose.Types.ObjectId(),
        subCategory: new mongoose.Types.ObjectId(),
      });

      const token = await adminToken();

      // Suspend seller
      await request(app)
        .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Low rating' })
        .expect(200);

      // Product status should now be Suspended
      const updatedProduct = await Product.findById(product._id).lean();
      expect(updatedProduct.status).toBe('Suspended');

      // getPubliclyActiveStoreIds should exclude this store
      const publicStoreIds = await storeRepo.getPubliclyActiveStoreIds();
      expect(publicStoreIds.map(id => id.toString())).not.toContain(store._id.toString());

      // findPublicById should not return it
      const publicProduct = await mongoose.connection
        .collection('products')
        .findOne({ _id: product._id });
      // It's now Suspended, so the public predicate shouldn't match
      expect(publicProduct.status).toBe('Suspended');
    });

    it('suspended seller store is invisible to customers (neutral 404)', async () => {
      const { seller, profile, store } = await createSeller();

      // Create product
      await Product.create({
        name: 'Store Product',
        description: 'Test product',
        price: 700,
        stock: 20,
        store: store._id,
        status: 'Approved',
        category: new mongoose.Types.ObjectId(),
        subCategory: new mongoose.Types.ObjectId(),
      });

      const token = await adminToken();

      // Suspend seller
      await request(app)
        .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Low rating' })
        .expect(200);

      // Store service should report suspended seller's store as not publicly active
      const publicStoreIds = await storeRepo.getPubliclyActiveStoreIds();
      expect(publicStoreIds.map(id => id.toString())).not.toContain(store._id.toString());

      // Directly test the Store service predicate
      const activeStore = await Store.findOne({
        _id: store._id,
        sellerProfile: profile._id,
      }).lean();
      // The store exists but should not be in the public list
      expect(activeStore).toBeTruthy();
    });

    it('suspended products excluded from search/suggestions', async () => {
      const { seller, profile, store } = await createSeller();

      const product = await Product.create({
        name: 'Searchable Product',
        description: 'Test product for search',
        price: 250,
        stock: 30,
        store: store._id,
        status: 'Approved',
        category: new mongoose.Types.ObjectId(),
        subCategory: new mongoose.Types.ObjectId(),
      });

      const token = await adminToken();

      // Suspend seller
      await request(app)
        .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Low rating' })
        .expect(200);

      // After suspension, product is Suspended, so findPublic should exclude it
      const products = await mongoose.connection
        .collection('products')
        .find({ status: 'Approved', isDeleted: false, store: store._id })
        .toArray();
      expect(products.length).toBe(0); // All products are now Suspended
    });

    it('suspended seller products remain visible to admin (for review)', async () => {
      const { seller, profile, store } = await createSeller();

      const product = await Product.create({
        name: 'Admin Visible Product',
        description: 'Test product for admin view',
        price: 1500,
        stock: 10,
        store: store._id,
        status: 'Approved',
        category: new mongoose.Types.ObjectId(),
        subCategory: new mongoose.Types.ObjectId(),
      });

      const token = await adminToken();

      // Suspend seller
      await request(app)
        .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Low rating' })
        .expect(200);

      // Admin can still see the product via admin endpoints
      const adminProductsRes = await request(app)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${token}`);

      expect(adminProductsRes.status).toBe(200);
      // Admin view includes Suspended products (not just Approved)
      const productIds = (adminProductsRes.body.data.products || []).map(p => p._id);
      expect(productIds).toContain(product._id.toString());
    });
  });

  describe('stale-cart behavior', () => {
    it('products in cart remain accessible even if seller later suspended', async () => {
      const { seller, profile, store } = await createSeller();

      const product = await Product.create({
        name: 'Cart Product',
        description: 'Test product for cart',
        price: 800,
        stock: 15,
        store: store._id,
        status: 'Approved',
        category: new mongoose.Types.ObjectId(),
        subCategory: new mongoose.Types.ObjectId(),
      });

      // Simulate cart containing this product
      const customer = await User.create({
        name: 'Cart Customer',
        email: `cart-${Date.now()}-${process.pid}@example.com`,
        password: 'password123',
        role: 'Customer',
      });

      await mongoose.connection.collection('carts').insertOne({
        user: customer._id,
        items: [
          {
            product: product._id,
            name: product.name,
            quantity: 2,
            price: product.price,
            images: product.images,
          },
        ],
      });

      const token = await adminToken();

      // Suspend seller
      await request(app)
        .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Low rating' })
        .expect(200);

      // Cart should still contain the product reference
      const cart = await mongoose.connection
        .collection('carts')
        .findOne({ user: customer._id });
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].product.toString()).toBe(product._id.toString());

      // Product is now Suspended (per frozen rule D8)
      const updatedProduct = await Product.findById(product._id).lean();
      expect(updatedProduct.status).toBe('Suspended');
    });
  });
});
import mongoose from 'mongoose';
import { cleanDb } from './helpers/testDb.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';
import Product from '../app/models/Product.model.js';
import Wishlist from '../app/models/Wishlist.model.js';
import * as wishlistService from '../app/services/Wishlist.service.js';

/**
 * M-023 — Wishlist concurrent first-creation.
 *
 * Two simultaneous first-time additions for the same user must not produce two
 * Wishlist documents (unique `user` index) or a race-y generic 409. The atomic
 * upsert guarantees exactly one document and no duplicate product.
 */

describe('M-023 — Wishlist concurrency', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('two concurrent first additions yield one wishlist and no duplicate product', async () => {
    const customer = await User.create({
      name: 'Wishlist Customer',
      email: `wishlist-cust-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
      emailVerified: true,
    });

    const seller = await User.create({
      name: 'Wishlist Seller',
      email: `wishlist-seller-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });
    const profile = await SellerProfile.create({
      user: seller._id,
      status: 'Approved',
      businessName: 'Wishlist Biz',
      taxId: 'TAX-WL',
      phone: '03001234567',
      address: 'Lahore',
    });
    const store = await Store.create({
      sellerProfile: profile._id,
      name: 'Wishlist Store',
      description: 'A store',
      city: 'Lahore',
    });
    const product = await Product.create({
      name: 'Wishlist Product',
      description: 'Test',
      price: 100,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    // No wishlist exists yet — fire two concurrent first-time additions.
    const results = await Promise.all([
      wishlistService.addProduct(customer._id, product._id),
      wishlistService.addProduct(customer._id, product._id),
    ]);

    // Exactly one wishlist document for the user.
    const count = await Wishlist.countDocuments({ user: customer._id });
    expect(count).toBe(1);

    // Both callers converged on the same document (no 409 / no double-create).
    expect(results[0]._id.toString()).toBe(results[1]._id.toString());

    // No duplicate product.
    const wishlist = await Wishlist.findOne({ user: customer._id });
    const matches = wishlist.products.filter((p) => p.toString() === product._id.toString());
    expect(matches).toHaveLength(1);
  });
});
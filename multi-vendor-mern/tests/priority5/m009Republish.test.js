import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import SellerProfile from '../../app/models/SellerProfile.model.js';
import Store from '../../app/models/Store.model.js';
import Product from '../../app/models/Product.model.js';

/**
 * M-009 — Republish / Restoration flow.
 *
 * Canonical backend contract: PUT /api/v1/seller/products/:id/republish
 * (aligned with PUT-based create/edit pattern in seller product routes).
 *
 * This test proves:
 * 1. Frontend/backend contract matches (PUT, not POST).
 * 2. Authorized republish succeeds (seller reinstated + product Suspended).
 * 3. Unauthorized users cannot republish (403 from resolveStore while suspended).
 * 4. Suspended seller restrictions remain enforced.
 * 5. Product visibility correct: Suspended → PendingApproval (NOT public).
 * 6. Existing product CRUD/publishing behavior not broken.
 */

const seedSeller = async ({ status = 'Approved' } = {}) => {
  const seller = await User.create({
    name: 'M009 Seller',
    email: `m009-seller-${Date.now()}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status,
    businessName: 'M009 Business',
    taxId: 'M009-TAX',
    phone: '03001234567',
    address: 'Lahore',
  });
  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'M009 Store',
    description: 'Store',
    city: 'Lahore',
  });
  const token = generateTestToken({
    sub: seller._id.toString(),
    roles: ['Seller'],
    permissions: ['Seller.Products.Edit'],
  });
  return { seller, profile, store, token };
};

const adminToken = async () => {
  const admin = await User.create({
    name: 'M009 Admin',
    email: `m009-admin-${Date.now()}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Admin',
  });
  return generateTestToken({ sub: admin._id.toString(), roles: ['Admin'] });
};

describe('M-009 — Republish / Restoration flow', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('M-009: frontend/backend contract matches — republish uses PUT', async () => {
    const { profile, store, token } = await seedSeller({ status: 'Approved' });
    // Create a Suspended product (status set directly for test isolation)
    const product = await Product.create({
      name: 'Contract Product',
      description: 'Test',
      price: 100,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Suspended',
    });

    // Suspend then reinstate the seller
    await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
      .set('Authorization', `Bearer ${await adminToken()}`)
      .send({ reason: 'Test' })
      .expect(200);

    await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/reinstate`)
      .set('Authorization', `Bearer ${await adminToken()}`)
      .expect(200);

    // The canonical endpoint is PUT (not POST) — matching the PUT create/edit pattern
    const res = await request(app)
      .put(`/api/v1/seller/products/${product._id}/republish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.message).toBe('Product submitted for re-approval');
    expect(res.body.data.status).toBe('PendingApproval');

    // Verify in DB
    const updated = await Product.findById(product._id);
    expect(updated.status).toBe('PendingApproval');
  });

  it('M-009: suspended seller cannot republish (403 from resolveStore)', async () => {
    const { profile, store, token } = await seedSeller({ status: 'Approved' });
    const product = await Product.create({
      name: 'Suspended Product',
      description: 'Test',
      price: 100,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Suspended',
    });

    // Suspend the seller — they are now blocked by resolveStore
    await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
      .set('Authorization', `Bearer ${await adminToken()}`)
      .send({ reason: 'Test' })
      .expect(200);

    const res = await request(app)
      .put(`/api/v1/seller/products/${product._id}/republish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(res.body.message).toBe('Your seller account is suspended and cannot create new marketplace activity');
    // Product remains Suspended
    const unchanged = await Product.findById(product._id);
    expect(unchanged.status).toBe('Suspended');
  });

  it('M-009: reinstated seller can republish Suspended product to PendingApproval', async () => {
    const { profile, store, token } = await seedSeller({ status: 'Approved' });
    const product = await Product.create({
      name: 'Reinstate Product',
      description: 'Test',
      price: 100,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Suspended',
    });

    await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
      .set('Authorization', `Bearer ${await adminToken()}`)
      .send({ reason: 'Test' })
      .expect(200);

    await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/reinstate`)
      .set('Authorization', `Bearer ${await adminToken()}`)
      .expect(200);

    await request(app)
      .put(`/api/v1/seller/products/${product._id}/republish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const updated = await Product.findById(product._id);
    expect(updated.status).toBe('PendingApproval');
    expect(updated.warningCount).toBe(0); // D5: warningCount reset
    expect(updated.rejectionReason).toBeNull();
    expect(updated.internalNote).toBeNull();
  });

  it('M-009: non-Suspended product cannot be republished (409)', async () => {
    const { profile, store, token } = await seedSeller({ status: 'Approved' });
    const product = await Product.create({
      name: 'Approved Product',
      description: 'Test',
      price: 100,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    const res = await request(app)
      .put(`/api/v1/seller/products/${product._id}/republish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    expect(res.body.message).toBe('Only suspended products can be republished');
    // Product status unchanged
    const unchanged = await Product.findById(product._id);
    expect(unchanged.status).toBe('Approved');
  });

  it('M-009: product visibility remains correct — Suspended product never goes public until admin re-approves', async () => {
    const { profile, store, token } = await seedSeller({ status: 'Approved' });
    const product = await Product.create({
      name: 'Visibility Product',
      description: 'Test',
      price: 100,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Suspended',
    });

    await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
      .set('Authorization', `Bearer ${await adminToken()}`)
      .send({ reason: 'Test' })
      .expect(200);

    await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/reinstate`)
      .set('Authorization', `Bearer ${await adminToken()}`)
      .expect(200);

    // Republish moves to PendingApproval — NOT to Approved/public
    await request(app)
      .put(`/api/v1/seller/products/${product._id}/republish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const updated = await Product.findById(product._id);
    expect(updated.status).toBe('PendingApproval');

    // Public listing must NOT include PendingApproval products
    const publicProducts = await request(app)
      .get('/api/v1/products')
      .expect(200);

    const found = publicProducts.body.data.items.find(p => p._id === product._id.toString());
    expect(found).toBeUndefined();
  });

  it('M-009: existing product CRUD behavior not broken — edit still works', async () => {
    const { store, token } = await seedSeller({ status: 'Approved' });
    const product = await Product.create({
      name: 'Editable Product',
      description: 'Original',
      price: 100,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    // Normal edit (PUT /seller/products/:id) still works
    const res = await request(app)
      .put(`/api/v1/seller/products/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Edited Product')
      .field('price', '200')
      .expect(200);

    expect(res.body.data.name).toBe('Edited Product');
    expect(res.body.data.price).toBe(200);
    // Status remains Approved (edit does not change status for Approved products)
    const updated = await Product.findById(product._id);
    expect(updated.status).toBe('Approved');
  });
});
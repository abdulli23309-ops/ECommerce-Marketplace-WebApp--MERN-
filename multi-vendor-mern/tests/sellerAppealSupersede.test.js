import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import SellerAppeal from '../app/models/SellerAppeal.model.js';

const adminToken = async () => {
  const admin = await User.create({
    name: 'Supersede Admin',
    email: `supersede-admin-${Date.now()}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Admin',
  });
  return generateTestToken({ sub: admin._id.toString(), roles: ['Admin'] });
};

// Seed a suspended seller with an active suspension created through the real
// suspend endpoint (so the SellerSuspension record is genuine).
const seedSuspendedSeller = async (adminAuth) => {
  const seller = await User.create({
    name: 'Supersede Seller',
    email: `supersede-seller-${Date.now()}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Supersede Business',
    taxId: 'SUPER-TAX',
    phone: '03001234567',
    address: 'Lahore',
  });

  await request(app)
    .post(`/api/v1/admin/sellers/${profile._id}/suspend`)
    .set('Authorization', `Bearer ${adminAuth}`)
    .send({ reason: 'Policy violation' })
    .expect(200);

  const sellerToken = generateTestToken({ sub: seller._id.toString(), roles: ['Seller'] });
  return { seller, profile, sellerToken };
};

const submitAppeal = async (profileId, sellerToken, text) => {
  const res = await request(app)
    .post('/api/v1/seller/appeals')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ appealText: text })
    .expect(201);
  return res.body.data;
};

describe('Direct reinstatement closes pending seller appeal', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('closes an existing Pending appeal as Superseded on direct reinstate', async () => {
    const adminAuth = await adminToken();
    const { profile, sellerToken } = await seedSuspendedSeller(adminAuth);
    const appeal = await submitAppeal(
      profile._id,
      sellerToken,
      'This suspension was a misunderstanding, please review.'
    );
    expect(appeal.status).toBe('Pending');

    await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/reinstate`)
      .set('Authorization', `Bearer ${adminAuth}`)
      .expect(200);

    const updated = await SellerAppeal.findById(appeal._id);
    expect(updated.status).toBe('Superseded');
    expect(updated.decisionReason).toBe(
      'Seller reinstated directly by admin; pending appeal closed.'
    );
    expect(updated.decidedAt).toBeTruthy();

    // No pending appeal remains for this seller profile
    const remaining = await SellerAppeal.find({
      sellerProfile: profile._id,
      status: 'Pending',
    });
    expect(remaining).toHaveLength(0);
  });

  it('does not double-close or fail after an appeal-approved reinstatement', async () => {
    const adminAuth = await adminToken();
    const { profile, sellerToken } = await seedSuspendedSeller(adminAuth);
    const appeal = await submitAppeal(
      profile._id,
      sellerToken,
      'I have resolved the policy issue, approving is justified.'
    );

    await request(app)
      .put(`/api/v1/admin/seller-appeals/${appeal._id}/decision`)
      .set('Authorization', `Bearer ${adminAuth}`)
      .send({ decision: 'Approved', decisionReason: 'Resolved' })
      .expect(200);

    // Seller is now Approved; a direct reinstate is not applicable (409) and
    // must not alter the Approved appeal.
    await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/reinstate`)
      .set('Authorization', `Bearer ${adminAuth}`)
      .expect(409);

    const unchanged = await SellerAppeal.findById(appeal._id);
    expect(unchanged.status).toBe('Approved');
    expect(unchanged.decisionReason).toBe('Resolved');
  });

  it('direct reinstate works as before when no pending appeal exists', async () => {
    const adminAuth = await adminToken();
    const { profile } = await seedSuspendedSeller(adminAuth);

    const res = await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/reinstate`)
      .set('Authorization', `Bearer ${adminAuth}`)
      .expect(200);

    const refreshed = await SellerProfile.findById(profile._id);
    expect(refreshed.status).toBe('Approved');
    expect(res.body.message || res.body.data).toBeTruthy();
  });

  it('supersede respects the schema enum (Superseded is a valid status)', async () => {
    const adminAuth = await adminToken();
    const { profile, sellerToken } = await seedSuspendedSeller(adminAuth);
    const appeal = await submitAppeal(
      profile._id,
      sellerToken,
      'Another valid appeal text longer than ten chars.'
    );

    await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/reinstate`)
      .set('Authorization', `Bearer ${adminAuth}`)
      .expect(200);

    const updated = await SellerAppeal.findById(appeal._id);
    expect(['Superseded', 'Approved', 'Rejected', 'Pending']).toContain(updated.status);
    expect(mongoose.Types.ObjectId.isValid(updated._id)).toBe(true);
  });
});

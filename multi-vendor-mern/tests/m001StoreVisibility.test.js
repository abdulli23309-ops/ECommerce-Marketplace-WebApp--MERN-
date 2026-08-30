import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';

/**
 * M-001 — public store visibility.
 *
 * A public store (GET /api/v1/stores/:id) must be hidden (neutral 404) when:
 *   1. the store is deactivated (Store.isActive === false), OR
 *   2. the owning seller is Suspended.
 * An Approved seller with an active store remains publicly visible.
 */

let uid = 0;
const nextUid = () => (uid += 1);

const seedStore = async ({ sellerStatus = 'Approved', isActive = true } = {}) => {
  const seller = await User.create({
    name: 'M001 Seller',
    email: `m001-seller-${Date.now()}-${nextUid()}@example.com`,
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: sellerStatus,
    businessName: 'M001 Business',
    taxId: 'TAX-001',
    phone: '03001234567',
    address: 'Lahore',
  });
  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'M001 Store',
    description: 'A store',
    city: 'Lahore',
    isActive,
  });
  return { seller, profile, store };
};

describe('M-001 — Public store visibility (Store.isActive + suspension)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('active store of an Approved seller is publicly visible (200)', async () => {
    const { store } = await seedStore({ sellerStatus: 'Approved', isActive: true });
    const res = await request(app).get(`/api/v1/stores/${store._id}`).expect(200);
    expect(res.body.data._id).toBe(store._id.toString());
  });

  it('deactivated store (isActive === false) is hidden (404)', async () => {
    const { store } = await seedStore({ sellerStatus: 'Approved', isActive: false });
    const res = await request(app).get(`/api/v1/stores/${store._id}`).expect(404);
    expect(res.body.message).toBe('Store not found');
  });

  it('suspended seller’s active store is hidden (404)', async () => {
    const { store } = await seedStore({ sellerStatus: 'Suspended', isActive: true });
    await request(app).get(`/api/v1/stores/${store._id}`).expect(404);
  });
});
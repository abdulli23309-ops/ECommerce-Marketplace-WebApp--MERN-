import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import User from '../../app/models/User.model.js';
import SellerProfile from '../../app/models/SellerProfile.model.js';
import SellerAppeal from '../../app/models/SellerAppeal.model.js';
import { cleanDb } from '../helpers/testDb.js';
import * as moderationService from '../../app/services/Moderation.service.js';
import * as sellerAppealService from '../../app/services/SellerAppeal.service.js';

// Partial repo mocks: only the write paths under test are replaceable; all
// other repository functions keep their real implementations.
const mocks = vi.hoisted(() => ({
  suspensionCreate: vi.fn(),
  appealFindById: vi.fn(),
}));

vi.mock('../../app/repositories/SellerSuspension.repository.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, create: mocks.suspensionCreate };
});

vi.mock('../../app/repositories/SellerAppeal.repository.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, findById: mocks.appealFindById };
});

const seedApprovedProfile = async () => {
  const seller = await User.create({
    name: 'MongoErr Seller',
    email: `mongoerr-${Date.now()}-${process.pid}@example.com`,
    password: 'password123',
    role: 'Seller',
  });
  return SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'MongoErr Business',
    taxId: 'TAX-1',
    phone: '03001234567',
    address: 'Lahore',
  });
};

const actorId = () => new mongoose.Types.ObjectId().toString();

describe('Priority 5 — Mongo error → HTTP mapping (M-010)', () => {
  beforeEach(async () => {
    await cleanDb();
    vi.clearAllMocks();
  });

  it('suspendSeller does NOT map a MongoServerError validation failure (code 121) to 409', async () => {
    const profile = await seedApprovedProfile();
    mocks.suspensionCreate.mockRejectedValueOnce(
      Object.assign(new Error('Document failed validation'), {
        name: 'MongoServerError',
        code: 121,
      })
    );

    let caught;
    try {
      await moderationService.suspendSeller(profile._id.toString(), 'reason', actorId());
    } catch (err) {
      caught = err;
    }

    // The raw error must propagate — it is NOT an ApiError (no statusCode/409).
    expect(caught).toBeDefined();
    expect(caught.name).toBe('MongoServerError');
    expect(caught.code).toBe(121);
    expect(caught.statusCode).toBeUndefined();
  });

  it('suspendSeller still maps a duplicate-key error (11000) to 409', async () => {
    const profile = await seedApprovedProfile();
    mocks.suspensionCreate.mockRejectedValueOnce(
      Object.assign(new Error('E11000 duplicate key'), { code: 11000 })
    );

    await expect(
      moderationService.suspendSeller(profile._id.toString(), 'reason', actorId())
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Seller is already suspended',
    });
  });

  it('decideAppeal does NOT map a generic MongoError (connection failure) to 409', async () => {
    const appealId = new mongoose.Types.ObjectId();
    mocks.appealFindById.mockResolvedValue({
      _id: appealId,
      status: 'Pending',
      sellerProfile: new mongoose.Types.ObjectId(),
    });

    // The first in-transaction read is the model-level lock lookup — make it
    // fail with a generic (non-conflict) driver error.
    const spy = vi
      .spyOn(SellerAppeal, 'findByIdAndUpdate')
      .mockRejectedValueOnce(
        Object.assign(new Error('connection destroyed'), { name: 'MongoError' })
      );

    let caught;
    try {
      await sellerAppealService.decideAppeal(appealId.toString(), 'Approved', 'ok', actorId());
    } catch (err) {
      caught = err;
    } finally {
      spy.mockRestore();
    }

    expect(caught).toBeDefined();
    expect(caught.name).toBe('MongoError');
    expect(caught.statusCode).toBeUndefined();
  });

  it('decideAppeal still maps an explicit transaction WriteConflict (112) to 409', async () => {
    const appealId = new mongoose.Types.ObjectId();
    mocks.appealFindById.mockResolvedValue({
      _id: appealId,
      status: 'Pending',
      sellerProfile: new mongoose.Types.ObjectId(),
    });

    const spy = vi
      .spyOn(SellerAppeal, 'findByIdAndUpdate')
      .mockRejectedValueOnce(Object.assign(new Error('WriteConflict'), { code: 112 }));

    await expect(
      sellerAppealService.decideAppeal(appealId.toString(), 'Rejected', 'ok', actorId())
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'This appeal has already been decided',
    });

    spy.mockRestore();
  });
});

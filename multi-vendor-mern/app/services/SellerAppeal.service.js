import mongoose from 'mongoose';
import SellerProfile from '../models/SellerProfile.model.js';
import SellerAppeal from '../models/SellerAppeal.model.js';
import Store from '../models/Store.model.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import * as suspensionRepo from '../repositories/SellerSuspension.repository.js';
import * as appealRepo from '../repositories/SellerAppeal.repository.js';
import * as storeRepo from '../repositories/Store.repository.js';
import * as productRepo from '../repositories/Product.repository.js';
import { logAction } from './AdminAuditLog.service.js';
import { createNotification, notifyAdmins } from './Notification.service.js';
import { ApiError } from '../utils/ApiError.util.js';

const MODERATION_AUDIT_TYPE = 'moderation';
const APPEAL_COOLDOWN_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Spec D1: at most ONE pending appeal per suspension (enforced by the partial
// unique index). After a rejection, a 30-day cooldown applies before a new
// appeal may be submitted; full appeal history is preserved regardless.
export const submitAppeal = async (sellerProfileId, appealText, submittedBy) => {
  const profile = await sellerProfileRepo.findById(sellerProfileId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');

  if (profile.status !== 'Suspended') {
    throw new ApiError(409, 'No active suspension to appeal');
  }

  const activeSuspension = await suspensionRepo.findActiveBySellerProfile(sellerProfileId);
  if (!activeSuspension) {
    throw new ApiError(409, 'No active suspension to appeal');
  }

  // One pending appeal per suspension (DB-level guard via partial unique index).
  const existingPending = await appealRepo.findPendingBySuspension(activeSuspension._id);
  if (existingPending) {
    throw new ApiError(409, 'An appeal is already pending for this suspension');
  }

  // 30-day cooldown after the most recent REJECTED appeal.
  const priorAppeals = await appealRepo.findBySuspension(activeSuspension._id);
  const lastRejected = priorAppeals
    .filter((a) => a.status === 'Rejected' && a.decidedAt)
    .sort((a, b) => new Date(b.decidedAt) - new Date(a.decidedAt))[0];

  if (lastRejected) {
    const sinceRejectMs = Date.now() - new Date(lastRejected.decidedAt).getTime();
    if (sinceRejectMs < APPEAL_COOLDOWN_DAYS * DAY_MS) {
      const remainingDays = Math.ceil(
        (APPEAL_COOLDOWN_DAYS * DAY_MS - sinceRejectMs) / DAY_MS
      );
      throw new ApiError(
        429,
        `You may submit another appeal in ${remainingDays} day(s) (30-day cooldown after rejection).`
      );
    }
  }

  let appeal;
  try {
    appeal = await appealRepo.create({
      suspension: activeSuspension._id,
      sellerProfile: sellerProfileId,
      status: 'Pending',
      appealText,
      submittedBy,
      submittedAt: new Date(),
      history: [{ event: 'SUBMITTED', by: submittedBy, at: new Date() }],
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new ApiError(
        409,
        'An appeal is already pending for this suspension'
      );
    }
    throw err;
  }

  await logAction(submittedBy, 'seller.appeal.submit', 'SellerAppeal', appeal._id, {
    sellerProfileId: sellerProfileId.toString(),
  });

  if (profile.user) {
    await createNotification(
      profile.user,
      MODERATION_AUDIT_TYPE,
      'Appeal submitted',
      'Your appeal has been received and is under review.',
      '/seller/appeals',
      { appealId: appeal._id.toString() }
    );
  }

  await notifyAdmins(
    MODERATION_AUDIT_TYPE,
    'New seller appeal',
    `${profile.businessName || 'A seller'} submitted an appeal.`,
    '/admin/seller-appeals',
    { appealId: appeal._id.toString() }
  );

  return appeal;
};

// Seller views their own appeals.
export const getSellerAppeals = (sellerProfileId, status) =>
  appealRepo.findBySellerProfile(sellerProfileId, status);

export const getSellerAppealById = (appealId) => appealRepo.findById(appealId);

// Admin dashboard listing with populated seller/profile/suspension for display.
export const getAppealsForAdmin = (status) => {
  const query = {};
  if (status) query.status = status;
  return SellerAppeal.find(query)
    .populate('sellerProfile', 'businessName warningCount user store')
    .populate({
      path: 'sellerProfile',
      populate: { path: 'user', select: 'name email' }
    })
    .populate({
      path: 'sellerProfile',
      populate: { path: 'store', select: 'name' }
    })
    .populate('suspension', 'reason suspendedAt')
    .populate('submittedBy', 'name')
    .populate('decidedBy', 'name')
    .sort({ submittedAt: -1 });
};

// Decide an appeal (approve => lift suspension + reinstate; reject => cooldown).
// Concurrent decisions are prevented by re-checking status inside the update.
export const decideAppeal = async (appealId, decision, decisionReason, actorId) => {
  if (!['Approved', 'Rejected'].includes(decision)) {
    throw new ApiError(400, "Decision must be 'Approved' or 'Rejected'");
  }

  const appeal = await appealRepo.findById(appealId);
  if (!appeal) throw new ApiError(404, 'Appeal not found');
  if (appeal.status !== 'Pending') {
    throw new ApiError(409, 'This appeal has already been decided');
  }

  const session = await mongoose.startSession();
  try {
    await session.startTransaction();

    // Re-fetch under the transaction to guard against a concurrent decision.
    const locked = await SellerAppeal.findByIdAndUpdate(
      appealId,
      { $setOnInsert: {} },
      { new: true, session }
    );
    if (locked.status !== 'Pending') {
      await session.abortTransaction();
      throw new ApiError(409, 'This appeal has already been decided');
    }

    await appealRepo.findByIdAndUpdate(
      appealId,
      {
        status: decision,
        decidedAt: new Date(),
        decidedBy: actorId,
        decisionReason: decisionReason || '',
        $push: {
          history: {
            event: decision === 'Approved' ? 'APPROVED' : 'REJECTED',
            by: actorId,
            note: decisionReason || '',
            at: new Date(),
          },
        },
      },
      { session }
    );

    if (decision === 'Approved') {
      // Lift the suspension and reinstate the seller (Spec D5 reset handled by
      // reinstateSeller's profile update). We lift the suspension record here
      // and set the profile back to Approved.
      const activeSuspension = await suspensionRepo.findActiveBySellerProfile(
        appeal.sellerProfile
      );
      if (activeSuspension) {
        await suspensionRepo.findByIdAndUpdate(
          activeSuspension._id,
          {
            status: 'Lifted',
            liftedAt: new Date(),
            liftedBy: actorId,
            $push: {
              timeline: { event: 'LIFTED', by: actorId, at: new Date() },
            },
          },
          { session }
        );
      }

      await sellerProfileRepo.updateModerationState(
        appeal.sellerProfile,
        { status: 'Approved', warningCount: 0 },
        { session }
      );

      const store = await storeRepo.findBySeller(appeal.sellerProfile);
      if (store) {
        await productRepo.bulkRestoreSuspendedByStore(store._id, session);
      }
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    if (err.message?.includes('replica set') || err.message?.includes('Transaction numbers')) {
      // Fallback for standalone MongoDB deployments
      const locked = await SellerAppeal.findByIdAndUpdate(
        appealId,
        { $setOnInsert: {} },
        { new: true }
      );
      if (locked.status !== 'Pending') {
        throw new ApiError(409, 'This appeal has already been decided');
      }

      await appealRepo.findByIdAndUpdate(
        appealId,
        {
          status: decision,
          decidedAt: new Date(),
          decidedBy: actorId,
          decisionReason: decisionReason || '',
          $push: {
            history: {
              event: decision === 'Approved' ? 'APPROVED' : 'REJECTED',
              by: actorId,
              note: decisionReason || '',
              at: new Date(),
            },
          },
        }
      );

      if (decision === 'Approved') {
        const activeSuspension = await suspensionRepo.findActiveBySellerProfile(
          appeal.sellerProfile
        );
        if (activeSuspension) {
          await suspensionRepo.findByIdAndUpdate(
            activeSuspension._id,
            {
              status: 'Lifted',
              liftedAt: new Date(),
              liftedBy: actorId,
              $push: {
                timeline: { event: 'LIFTED', by: actorId, at: new Date() },
              },
            }
          );
        }

        await sellerProfileRepo.updateModerationState(
          appeal.sellerProfile,
          { status: 'Approved', warningCount: 0 }
        );

        const store = await storeRepo.findBySeller(appeal.sellerProfile);
        if (store) {
          await productRepo.bulkRestoreSuspendedByStore(store._id);
        }
      }
    } else {
      // Transaction conflicts (e.g. WriteConflict 112 / LockTimeout 261) can arise
      // under concurrent decisions. Treat them as "already decided" so the loser
      // of the race gets a clean 409 instead of an opaque 500.
      if (
        err?.code === 112 ||
        err?.code === 251 ||
        err?.code === 261
      ) {
        throw new ApiError(409, 'This appeal has already been decided');
      }
      throw err;
    }
  } finally {
    await session.endSession();
  }

  const profile = await sellerProfileRepo.findById(appeal.sellerProfile);

  await logAction(actorId, `seller.appeal.${decision.toLowerCase()}`, 'SellerAppeal', appealId, {
    decisionReason: decisionReason || '',
  });

  if (profile?.user) {
    await createNotification(
      profile.user,
      MODERATION_AUDIT_TYPE,
      decision === 'Approved'
        ? 'Your appeal was approved'
        : 'Your appeal was rejected',
      decision === 'Approved'
        ? 'Your seller account has been reinstated. Suspended products remain unpublished and must be republished.'
        : decisionReason
          ? `Reason: ${decisionReason}`
          : 'Your appeal was rejected. You may submit a new appeal after the 30-day cooldown.',
      decision === 'Approved' ? '/seller/dashboard' : '/seller/appeals',
      { appealId: appealId.toString() }
    );
  }

  return appealRepo.findById(appealId);
};

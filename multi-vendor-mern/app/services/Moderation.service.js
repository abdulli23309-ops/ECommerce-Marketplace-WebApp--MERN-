import mongoose from 'mongoose';
import SellerProfile from '../models/SellerProfile.model.js';
import SellerSuspension from '../models/SellerSuspension.model.js';
import SellerAppeal from '../models/SellerAppeal.model.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import * as suspensionRepo from '../repositories/SellerSuspension.repository.js';
import * as appealRepo from '../repositories/SellerAppeal.repository.js';
import * as storeRepo from '../repositories/Store.repository.js';
import * as productRepo from '../repositories/Product.repository.js';
import AdminAuditLog from '../models/AdminAuditLog.model.js';
import { logAction } from './AdminAuditLog.service.js';
import { createNotification, notifyAdmins } from './Notification.service.js';
import { ApiError } from '../utils/ApiError.util.js';

const MODERATION_AUDIT_TYPE = 'moderation';

// ---- Suspension lifecycle ----

// Suspend a seller. Uses a Mongo transaction so the profile status flip and the
// Active SellerSuspension insert either both happen or neither. A partial unique
// index guards against two Active suspensions for the same profile. Suspension
// NEVER touches User.isActive (frozen rule) so the seller keeps full customer
// access. Audit + notifications are post-commit secondary effects.
export const suspendSeller = async (sellerProfileId, reasonOrPayload, actorId) => {
  const reason =
    typeof reasonOrPayload === 'object' && reasonOrPayload !== null
      ? reasonOrPayload.reason
      : reasonOrPayload;
  const internalNote =
    typeof reasonOrPayload === 'object' && reasonOrPayload !== null
      ? reasonOrPayload.internalNote
      : '';

  const profile = await sellerProfileRepo.findById(sellerProfileId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  if (profile.status === 'Suspended') {
    throw new ApiError(409, 'Seller is already suspended');
  }

  const session = await mongoose.startSession();
  let result;
  try {
    await session.startTransaction();

    const updatedProfile = await sellerProfileRepo.setStatus(
      sellerProfileId,
      'Suspended',
      {},
      { session }
    );

    const suspension = await suspensionRepo.create(
      {
        sellerProfile: sellerProfileId,
        status: 'Active',
        reason: reason || '',
        internalNote: internalNote || '',
        suspendedBy: actorId,
        suspendedAt: new Date(),
        timeline: [
          {
            event: 'SUSPENDED',
            by: actorId,
            reason: reason || '',
            at: new Date(),
          },
        ],
      },
      { session }
    );

    // Frozen D5/D8: bulk-transition the seller's Approved products to Suspended
    // WITHIN the transaction. This keeps existing order/review/return history, and
    // after reinstatement the products stay inactive until explicitly republished.
    const store = await storeRepo.findBySeller(sellerProfileId);
    if (store) {
      await productRepo.bulkSetStatusByStore(store._id, 'Suspended', session);
    }

    await session.commitTransaction();
    result = { suspension: Array.isArray(suspension) ? suspension[0] : suspension, profile: updatedProfile };
  } catch (err) {
    await session.abortTransaction();
    if (err.message?.includes('replica set') || err.message?.includes('Transaction numbers')) {
      // Fallback for standalone MongoDB deployments
      const updatedProfile = await sellerProfileRepo.setStatus(
        sellerProfileId,
        'Suspended'
      );

      const suspension = await suspensionRepo.create(
        {
          sellerProfile: sellerProfileId,
          status: 'Active',
          reason: reason || '',
          internalNote: internalNote || '',
          suspendedBy: actorId,
          suspendedAt: new Date(),
          timeline: [
            {
              event: 'SUSPENDED',
              by: actorId,
              reason: reason || '',
              at: new Date(),
            },
          ],
        }
      );

      const store = await storeRepo.findBySeller(sellerProfileId);
      if (store) {
        await productRepo.bulkSetStatusByStore(store._id, 'Suspended');
      }

      result = { suspension: Array.isArray(suspension) ? suspension[0] : suspension, profile: updatedProfile };
    } else {
      // Duplicate-key on the partial unique index => an Active suspension already exists.
      if (err?.code === 11000) {
        throw new ApiError(409, 'Seller is already suspended');
      }
      if (
        err?.code === 112 ||
        err?.code === 251 ||
        err?.code === 261
      ) {
        throw new ApiError(409, 'Seller is already suspended');
      }
      throw err;
    }
  } finally {
    await session.endSession();
  }

  await logAction(actorId, 'seller.suspend', 'SellerProfile', sellerProfileId, {
    reason,
    internalNote,
  });

  if (profile.user) {
    await createNotification(
      profile.user,
      MODERATION_AUDIT_TYPE,
      'Your seller account has been suspended',
      reason
        ? `Reason: ${reason}`
        : 'Your seller account has been suspended. You may still shop as a customer and appeal this decision.',
      '/seller/suspended',
      { sellerProfileId: sellerProfileId.toString() }
    );
  }

  await notifyAdmins(
    MODERATION_AUDIT_TYPE,
    'Seller suspended',
    `${profile.businessName || 'A seller'} was suspended.`,
    '/admin/sellers',
    { sellerProfileId: sellerProfileId.toString() }
  );

  return result;
};

// Reinstate a suspended seller (Spec D5): lift the active suspension, set the
// profile back to Approved, and RESET the seller warning count to 0 (history is
// preserved). Suspended products are NOT auto-republished — the seller must
// explicitly republish each one. Runs in a transaction; audit/notify post-commit.
export const reinstateSeller = async (sellerProfileId, actorId) => {
  const profile = await sellerProfileRepo.findById(sellerProfileId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  if (profile.status !== 'Suspended') {
    throw new ApiError(409, 'Seller is not currently suspended');
  }

  const activeSuspension = await suspensionRepo.findActiveBySellerProfile(sellerProfileId);
  if (!activeSuspension) {
    throw new ApiError(409, 'No active suspension found for this seller');
  }

  const session = await mongoose.startSession();
  try {
    await session.startTransaction();

    // Spec D5: reset warning count to 0, preserve warningHistory, clear the
    // low-rating flag is NOT forced (let rating decide), restore Approved.
    await sellerProfileRepo.updateModerationState(
      sellerProfileId,
      { status: 'Approved', warningCount: 0, warningHistory: profile.warningHistory },
      { session }
    );

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

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    if (err.message?.includes('replica set') || err.message?.includes('Transaction numbers')) {
      // Fallback for standalone MongoDB deployments
      await sellerProfileRepo.updateModerationState(
        sellerProfileId,
        { status: 'Approved', warningCount: 0, warningHistory: profile.warningHistory }
      );
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
    } else {
      throw err;
    }
  } finally {
    await session.endSession();
  }

  await logAction(actorId, 'seller.reinstate', 'SellerProfile', sellerProfileId, {});

  if (profile.user) {
    await createNotification(
      profile.user,
      MODERATION_AUDIT_TYPE,
      'Your seller account has been reinstated',
      'You can resume marketplace activity. Note: products that were suspended remain unpublished and must be republished individually.',
      '/seller/dashboard',
      { sellerProfileId: sellerProfileId.toString() }
    );
  }

  await notifyAdmins(
    MODERATION_AUDIT_TYPE,
    'Seller reinstated',
    `${profile.businessName || 'A seller'} was reinstated.`,
    '/admin/sellers',
    { sellerProfileId: sellerProfileId.toString() }
  );

  return sellerProfileRepo.findById(sellerProfileId);
};

export const getActiveSuspension = (sellerProfileId) =>
  suspensionRepo.findActiveBySellerProfile(sellerProfileId);

// Compose the full moderation timeline for a seller: warnings, suspensions, and
// appeals. Used by GET /admin/sellers/:id/timeline.
export const getModerationTimeline = async (sellerProfileId) => {
  const profile = await sellerProfileRepo.findById(sellerProfileId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');

  const suspensions = await suspensionRepo.findBySellerProfile(sellerProfileId);
  const appeals = await appealRepo.findBySellerProfile(sellerProfileId);

  const entries = [];

  (profile.warningHistory || []).forEach((w) => {
    entries.push({
      kind: 'warning',
      at: w.warnedAt,
      by: w.warnedBy,
      note: w.reason,
    });
  });

  suspensions.forEach((s) => {
    (s.timeline || []).forEach((t) => {
      entries.push({
        kind: 'suspension',
        event: t.event,
        at: t.at,
        by: t.by,
        note: t.reason,
      });
    });
  });

  appeals.forEach((a) => {
    (a.history || []).forEach((h) => {
      entries.push({
        kind: 'appeal',
        event: h.event,
        at: h.at,
        by: h.by,
        note: h.note,
      });
    });
  });

  // Events that have NO dedicated domain record (e.g. product.republish) are
  // sourced from the immutable AdminAuditLog. Domain-covered events (warnings,
  // suspensions, appeals) are rendered ONLY from their domain records above, so
  // this audit pull is limited to non-domain actions to avoid duplicate entries.
  const store = await storeRepo.findBySeller(sellerProfileId);
  if (store) {
    const productIds = (await productRepo.findIdsByStore(store._id)).map((p) => p._id);
    if (productIds.length) {
      const republishLogs = await AdminAuditLog.find({
        action: 'product.republish',
        entityId: { $in: productIds },
      })
        .sort({ createdAt: -1 })
        .lean();
      republishLogs.forEach((l) => {
        entries.push({
          kind: 'republish',
          event: 'REPUBLISHED',
          at: l.createdAt,
          by: l.actor,
          note: '',
        });
      });
    }
  }

  entries.sort((a, b) => new Date(b.at) - new Date(a.at));

  return {
    sellerProfileId,
    status: profile.status,
    warningCount: profile.warningCount,
    lowRatingStatus: profile.lowRatingStatus,
    timeline: entries,
  };
};

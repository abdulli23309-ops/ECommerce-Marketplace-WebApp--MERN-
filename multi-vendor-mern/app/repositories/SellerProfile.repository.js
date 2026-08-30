import SellerProfile from '../models/SellerProfile.model.js';

const findByUser = (userId) => SellerProfile.findOne({ user: userId });
const create = (data) => SellerProfile.create(data);

const findById = (id) => SellerProfile.findById(id);

const findByIds = (ids) => SellerProfile.find({ _id: { $in: ids } });

// Update moderation-related fields (status, rating, warning state). Accepts a
// partial object so callers can set only what they need (e.g. warningCount,
// lowRatingStatus, lastSellerWarningAt, status). `opts` may carry a mongoose session.
const updateModerationState = (id, patch, opts = {}) =>
  SellerProfile.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
    ...opts,
  });

const setStatus = (id, status, extra = {}, opts = {}) =>
  SellerProfile.findByIdAndUpdate(
    id,
    { status, ...extra },
    { new: true, runValidators: true, ...opts }
  );

// Find profiles whose current status is 'Suspended' (used by visibility chokepoint).
const findSuspendedProfileIds = async () => {
  const docs = await SellerProfile.find({ status: 'Suspended' }).distinct('_id');
  return docs;
};

export {
  create,
  findByUser,
  findById,
  findByIds,
  updateModerationState,
  setStatus,
  findSuspendedProfileIds,
};

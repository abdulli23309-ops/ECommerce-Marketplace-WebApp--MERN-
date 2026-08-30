import SellerSuspension from '../models/SellerSuspension.model.js';

// Mongoose 9 requires an array as the first arg to create() when a `session`
// option is supplied; otherwise the session is merged into the document and
// validation fails (e.g. `sellerProfile: Path is required`). Tracking the
// suspension insert inside the moderation transaction MUST pass the session.
// If no session, call with only the data (no second arg) to avoid Mongoose 9
// treating {} as a second document.
const create = (data, opts = {}) => {
  if (opts?.session) {
    return SellerSuspension.create([data], opts);
  }
  return SellerSuspension.create(data);
};

const findById = (id) => SellerSuspension.findById(id);

const findBySellerProfile = (sellerProfileId) =>
  SellerSuspension.find({ sellerProfile: sellerProfileId });

const findActiveBySellerProfile = (sellerProfileId) =>
  SellerSuspension.findOne({ sellerProfile: sellerProfileId, status: 'Active' });

const findByIdAndUpdate = (id, patch, opts = {}) =>
  SellerSuspension.findByIdAndUpdate(id, patch, { new: true, ...opts });

const findMostRecent = (sellerProfileId) =>
  SellerSuspension.findOne({ sellerProfile: sellerProfileId }).sort({
    suspendedAt: -1,
  });

export {
  create,
  findById,
  findBySellerProfile,
  findActiveBySellerProfile,
  findByIdAndUpdate,
  findMostRecent,
};

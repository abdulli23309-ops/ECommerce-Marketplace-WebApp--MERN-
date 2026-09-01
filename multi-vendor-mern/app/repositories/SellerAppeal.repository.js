import SellerAppeal from '../models/SellerAppeal.model.js';

// Session-safe create: pass an array first arg when a `session` is supplied so
// Mongoose 9 keeps it as an option rather than merging it into the document.
// If no session, call with only the data (no second arg) to avoid Mongoose 9
// treating {} as a second document.
const create = (data, opts = {}) => {
  if (opts?.session) {
    return SellerAppeal.create([data], opts);
  }
  return SellerAppeal.create(data);
};

const findById = (id) => SellerAppeal.findById(id);

const findBySellerProfile = (sellerProfileId, status) => {
  const query = { sellerProfile: sellerProfileId };
  if (status) query.status = status;
  return SellerAppeal.find(query).sort({ submittedAt: -1 });
};

const findBySuspension = (suspensionId, status) => {
  const query = { suspension: suspensionId };
  if (status) query.status = status;
  return SellerAppeal.find(query).sort({ submittedAt: -1 });
};

const findPendingBySuspension = (suspensionId) =>
  SellerAppeal.findOne({ suspension: suspensionId, status: 'Pending' });

const findPendingBySellerProfile = (sellerProfileId) =>
  SellerAppeal.find({ sellerProfile: sellerProfileId, status: 'Pending' });

const findByIdAndUpdate = (id, patch, opts = {}) =>
  SellerAppeal.findByIdAndUpdate(id, patch, { new: true, ...opts });

export {
  create,
  findById,
  findBySellerProfile,
  findBySuspension,
  findPendingBySuspension,
  findPendingBySellerProfile,
  findByIdAndUpdate,
};

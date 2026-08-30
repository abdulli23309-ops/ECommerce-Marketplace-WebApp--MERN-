import Coupon from '../models/Coupon.model.js';

export const create = (data) => Coupon.create(data);
export const findAllAdmin = ({ page = 1, pageSize = 20 } = {}) => {
  const query = { isDeleted: false };
  const skip = (Number(page) - 1) * Number(pageSize);
  return Promise.all([
    Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)).lean(),
    Coupon.countDocuments(query),
  ]);
};
export const findById = (id) => Coupon.findOne({ _id: id, isDeleted: false });
export const findByCode = (code) => Coupon.findOne({ code: code.toUpperCase(), isDeleted: false, isActive: true });
export const updateById = (id, data) =>
  Coupon.findByIdAndUpdate(id, data, { new: true, runValidators: true });
export const softDelete = (id) =>
  Coupon.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
// M-015: atomically increment usageCount ONLY while the coupon still has
// available usage (current usageCount < limit). The limit condition and the
// increment are evaluated in a single MongoDB document update, so concurrent
// redemptions cannot each observe remaining usage and over-increment. When the
// condition does not match (limit reached / a concurrent request won the race),
// findOneAndUpdate returns null. Coupons with an unlimited limit (null/undefined)
// never add the condition and always increment.
export const incrementUsageIfAvailable = (id, limit, session) => {
  const filter = { _id: id };
  if (limit !== null && limit !== undefined) {
    filter.usageCount = { $lt: limit };
  }
  return Coupon.findOneAndUpdate(
    filter,
    { $inc: { usageCount: 1 } },
    { new: true, session }
  );
};
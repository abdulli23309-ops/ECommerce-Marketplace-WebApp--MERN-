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
export const incrementUsage = (id, session) =>
  Coupon.findByIdAndUpdate(id, { $inc: { usageCount: 1 } }, { new: true, session });
import EmailOtp from '../models/EmailOtp.model.js';

export const create = (data) => EmailOtp.create(data);

export const findLatestByUserAndPurpose = (userId, purpose) =>
  EmailOtp.findOne({ user: userId, purpose, isUsed: false })
    .sort({ createdAt: -1 });

export const invalidateAllForUserAndPurpose = (userId, purpose) =>
  EmailOtp.updateMany(
    { user: userId, purpose, isUsed: false },
    { isUsed: true }
  );

export const updateAttempts = (id, attempts) =>
  EmailOtp.findByIdAndUpdate(id, { attempts }, { new: true });

export const markUsed = (id) =>
  EmailOtp.findByIdAndUpdate(id, { isUsed: true }, { new: true });
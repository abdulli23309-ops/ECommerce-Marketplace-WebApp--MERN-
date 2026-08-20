import User from '../models/User.model.js';

export const findById = (id, select = '') =>
  User.findById(id).select(select);

export const updateById = (id, update) =>
  User.findByIdAndUpdate(id, update, { new: true });

export const updateEmailVerified = (id, emailVerified) =>
  User.findByIdAndUpdate(id, { emailVerified }, { new: true });
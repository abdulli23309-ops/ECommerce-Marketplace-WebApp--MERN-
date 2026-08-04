import User from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.util.js';

export const getProfile = async (userId) => {
  const user = await User.findById(userId).populate('roles', 'name').lean();
  if (!user) throw new ApiError(404, 'User not found');
  // remove sensitive fields
  const { password, refreshTokens, ...profile } = user;
  return profile;
};

export const updateProfile = async (userId, data) => {
  const allowedFields = ['name', 'avatar'];
  const update = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  const user = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
  const { password, refreshTokens, ...profile } = user;
  return profile;
};

export const getMyPermissions = async (userId) => {
  const user = await User.findById(userId)
    .populate({
      path: 'roles',
      populate: { path: 'permissions', select: 'name' },
    })
    .lean();
  const permissions = user.roles.flatMap(r => r.permissions.map(p => p.name));
  const unique = [...new Set(permissions)];
  return { roles: user.roles.map(r => r.name), permissions: unique };
};

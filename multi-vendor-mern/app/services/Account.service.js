import User from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.util.js';
import bcrypt from 'bcrypt'; // make sure this is imported

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
      populate: [
        { path: 'permissions', select: 'code' },
        {
          path: 'permissionGroups',
          select: 'permissions',
          populate: { path: 'permissions', select: 'code' }
        }
      ]
    })
    .lean();

  if (!user) throw new ApiError(404, 'User not found');

  const roles = user.roles.map(r => r.name);
  const directCodes = user.roles.flatMap(r => (r.permissions || []).map(p => p.code));
  const groupCodes = user.roles.flatMap(r =>
    (r.permissionGroups || []).flatMap(g => (g.permissions || []).map(p => p.code))
  );
  const allCodes = [...new Set([...directCodes, ...groupCodes])];

  return { roles, permissions: allCodes };
};


export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');   // ← force include password
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(401, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();
};

export const updateAvatar = async (userId, avatarUrl) => {
  const user = await User.findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true }).lean();
  if (!user) throw new ApiError(404, 'User not found');
  const { password, refreshTokens, ...profile } = user;
  return profile;
};
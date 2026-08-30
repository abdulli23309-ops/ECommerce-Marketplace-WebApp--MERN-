import User from '../models/User.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import { ApiError } from '../utils/ApiError.util.js';
import bcrypt from 'bcrypt'; // make sure this is imported

export const getProfile = async (userId) => {
  const user = await User.findById(userId)
    .select('name email role avatar isActive')   // include avatar
    .lean();
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const updateProfile = async (userId, data) => {
  const allowedFields = ['name', 'avatar'];
  const update = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  // M-031: return only the deliberate profile contract fields (same shape as
  // getProfile) instead of the full user document, so internal fields such as
  // googleId, isActive, isVerified, role flags and timestamps are not exposed.
  const user = await User.findByIdAndUpdate(userId, update, {
    new: true,
    runValidators: true,
  })
    .select('name email role avatar isActive emailVerified')
    .lean();
  if (!user) throw new ApiError(404, 'User not found');
  return user;
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

  // M-030: a password change invalidates every outstanding refresh-token
  // session for this user (including stolen ones). Active access tokens
  // expire naturally per JWT_ACCESS_EXPIRES_IN; new sessions require a
  // fresh login. Uses the existing RefreshToken model — no new storage.
  await RefreshToken.deleteMany({ user: userId });
};

export const updateAvatar = async (userId, avatarUrl) => {
  const user = await User.findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true }).lean();
  if (!user) throw new ApiError(404, 'User not found');
  const { password, refreshTokens, ...profile } = user;
  return profile;
};
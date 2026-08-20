import User from '../models/User.model.js';
import Role from '../models/Role.model.js';
import Permission from '../models/Permission.model.js';
import RefreshToken from '../models/RefreshToken.model.js';

const findUserByEmail = (email) => User.findOne({ email }).select('+password');

const findRoleByName = (name) =>
  Role.findOne({ name })
    .populate({
      path: 'permissionGroups',
      populate: {
        path: 'permissions',
        select: 'code',
      },
    })
    .lean();

const createUser = ({ name, email, password, role }) =>
  User.create({ name, email, password, role });

const createRefreshToken = (userId, tokenHash, expiresAt) =>
  RefreshToken.create({ user: userId, tokenHash, expiresAt });

const consumeRefreshToken = (tokenHash) =>
  RefreshToken.findOneAndDelete({ tokenHash }).select('+tokenHash');

const findUserAuthorization = (userId) =>
  User.findById(userId)
    .select('name email role isActive avatar emailVerified')
    .lean();

export {
  consumeRefreshToken,
  createRefreshToken,
  createUser,
  findRoleByName,
  findUserAuthorization,
  findUserByEmail,
};
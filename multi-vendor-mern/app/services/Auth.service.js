import { ApiError } from '../utils/ApiError.util.js';
import {
  consumeRefreshToken,
  createRefreshToken,
  createUser,
  findRoleByName,
  findUserAuthorization,
  findUserByEmail,
} from '../repositories/Auth.repository.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
  verifyRefreshToken,
} from '../helpers/Jwt.helper.js';

const getAuthorization = (user) => {
  const roles = user.roles.map((role) => role.name);
  const permissions = [...new Set(user.roles.flatMap((role) => role.permissions.map((permission) => permission.name)))];
  return { roles, permissions };
};

const issueSession = async (user) => {
  const { roles, permissions } = getAuthorization(user);
  const accessToken = generateAccessToken(user._id, roles, permissions);
  const refreshToken = generateRefreshToken(user._id);
  await createRefreshToken(user._id, hashToken(refreshToken), getRefreshTokenExpiry());

  return {
    user: { id: user._id, name: user.name, email: user.email, roles, permissions },
    accessToken,
    refreshToken,
  };
};

const register = async ({ name, email, password }) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) throw new ApiError(409, 'Email already registered');

  const customerRole = await findRoleByName('Customer');
  if (!customerRole) throw new ApiError(503, 'Default Customer role is not configured');

  const user = await createUser({ name, email, password, roles: [customerRole._id] });
  const authorizedUser = await findUserAuthorization(user._id);
  return issueSession(authorizedUser);
};

const login = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'This account is inactive');

  const authorizedUser = await findUserAuthorization(user._id);
  return issueSession(authorizedUser);
};

const refreshAccessToken = async (refreshToken) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const storedToken = await consumeRefreshToken(hashToken(refreshToken));
  if (!storedToken || storedToken.expiresAt <= new Date()) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
  if (storedToken.user.toString() !== payload.sub) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await findUserAuthorization(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'User is not authorized');
  return issueSession(user);
};

const logout = async (refreshToken) => {
  if (refreshToken) await consumeRefreshToken(hashToken(refreshToken));
};

export { login, logout, refreshAccessToken, register };

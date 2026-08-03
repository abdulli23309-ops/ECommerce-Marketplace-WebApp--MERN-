import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { appConf } from '../config/init.js';

const accessSecret = () => {
  if (!process.env.JWT_ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET is not configured');
  return process.env.JWT_ACCESS_SECRET;
};

const refreshSecret = () => {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not configured');
  return process.env.JWT_REFRESH_SECRET;
};

const parseDurationToMilliseconds = (duration) => {
  const match = /^(\d+)\s*([smhd])$/.exec(duration);
  if (!match) throw new Error('JWT_REFRESH_EXPIRES_IN must use s, m, h, or d units');
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Number(match[1]) * units[match[2]];
};

const generateAccessToken = (userId, roles, permissions) => jwt.sign(
  { roles, permissions }, accessSecret(), { subject: userId.toString(), expiresIn: appConf.jwt.accessExpiresIn }
);

const generateRefreshToken = (userId) => jwt.sign(
  {}, refreshSecret(), { subject: userId.toString(), jwtid: crypto.randomUUID(), expiresIn: appConf.jwt.refreshExpiresIn }
);

const verifyAccessToken = (token) => jwt.verify(token, accessSecret());
const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret());
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const getRefreshTokenExpiry = () => new Date(Date.now() + parseDurationToMilliseconds(appConf.jwt.refreshExpiresIn));

export { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry, hashToken, verifyAccessToken, verifyRefreshToken };

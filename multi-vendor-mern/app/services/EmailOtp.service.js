import crypto from 'crypto';
import bcrypt from 'bcrypt';
import * as emailOtpRepo from '../repositories/EmailOtp.repository.js';
import * as userRepo from '../repositories/User.repository.js';
import { sendOtpEmail } from './Email.service.js';
import { ApiError } from '../utils/ApiError.util.js';

const OTP_EXPIRY_MINUTES = 3;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 3 * 60 * 1000;

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const hashOtp = async (otp) => bcrypt.hash(otp, 12);

export const generateAndSendOtp = async (userId, purpose) => {
  const user = await userRepo.findById(userId, 'email');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const email = user.email;

  const existing = await emailOtpRepo.findLatestByUserAndPurpose(userId, purpose);

  if (existing && existing.createdAt.getTime() > Date.now() - RESEND_COOLDOWN_MS) {
    throw new ApiError(429, 'Please wait 3 minutes before requesting another OTP');
  }

  // Invalidate any previous OTPs for this purpose.
  await emailOtpRepo.invalidateAllForUserAndPurpose(userId, purpose);

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const emailOtp = await emailOtpRepo.create({
    user: userId,
    email,
    purpose,
    otpHash,
    expiresAt,
    maxAttempts: MAX_ATTEMPTS,
  });

  const emailResult = await sendOtpEmail(email, otp, purpose);

  return {
    emailOtpId: emailOtp._id,
    expiresAt: emailOtp.expiresAt,
    delivered: emailResult.delivered,
    devMode: emailResult.devMode,
  };
};

export const verifyOtp = async (userId, purpose, otp) => {
  const emailOtp = await emailOtpRepo.findLatestByUserAndPurpose(userId, purpose);

  if (!emailOtp) {
    throw new ApiError(404, 'OTP not found');
  }

  if (emailOtp.isUsed) {
    throw new ApiError(400, 'OTP has already been used');
  }

  if (emailOtp.expiresAt < new Date()) {
    throw new ApiError(400, 'OTP has expired');
  }

  if (emailOtp.attempts >= emailOtp.maxAttempts) {
    throw new ApiError(400, 'Too many incorrect attempts. Please request a new OTP.');
  }

  const isMatch = await bcrypt.compare(otp, emailOtp.otpHash);

  if (!isMatch) {
    await emailOtpRepo.updateAttempts(emailOtp._id, emailOtp.attempts + 1);
    throw new ApiError(400, 'Invalid OTP');
  }

  await emailOtpRepo.markUsed(emailOtp._id);
  return true;
};

export const verifyOtpAndMarkVerified = async (userId, purpose, otp) => {
  await verifyOtp(userId, purpose, otp);

  await userRepo.updateEmailVerified(userId, true);

  return true;
};
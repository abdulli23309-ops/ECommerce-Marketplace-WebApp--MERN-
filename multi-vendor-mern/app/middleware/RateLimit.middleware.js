// Minimal, dependency-free in-memory rate limiting for security-sensitive
// authentication endpoints (login, register, Google auth, OTP send/verify).
//
// This is a per-process guard — NOT a distributed limiter. It is appropriate
// for a single Node process; multi-instance / Redis-backed limiting is an
// infrastructure decision and is intentionally out of scope here.
//
// The auth-specific guard factories are bypassed under NODE_ENV=test so the
// automated API suite is unaffected, mirroring the existing test-environment
// exemption used by mock Google auth (see GoogleAuth.service.js).

import { ApiError } from '../utils/ApiError.util.js';

// Per-key sliding-window buckets shared by all limiter instances. Keys are
// namespaced per limiter so distinct endpoints keep independent limits.
const buckets = new Map();

const clientKey = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const reapExpired = (now) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests, please try again later.',
  keyPrefix = '',
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    reapExpired(now);

    const key = keyPrefix ? `${keyPrefix}:${clientKey(req)}` : clientKey(req);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      return next(new ApiError(429, message));
    }

    bucket.count += 1;
    return next();
  };
};

// Authentication entry-point guard (login, register, Google auth).
const authLimiter = () => {
  if (process.env.NODE_ENV === 'test') return (req, res, next) => next();
  return createRateLimiter({
    max: 60,
    message: 'Too many requests. Please try again later.',
    keyPrefix: 'auth',
  });
};

// OTP send/verify guard — a tighter headroom since these are attempt-limited.
const otpLimiter = () => {
  if (process.env.NODE_ENV === 'test') return (req, res, next) => next();
  return createRateLimiter({
    max: 20,
    message: 'Too many OTP requests. Please try again later.',
    keyPrefix: 'otp',
  });
};

export { authLimiter, otpLimiter };
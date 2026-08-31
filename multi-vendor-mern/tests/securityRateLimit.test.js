import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../app/middleware/RateLimit.middleware.js';

// Narrow unit coverage for the in-memory auth rate limiter. It exercises the
// raw middleware (createRateLimiter) directly, so the NODE_ENV=test bypass used
// by the mounted auth guards does not interfere with verification of the guard.

const call = (mw, count) => {
  const errors = [];
  for (let i = 0; i < count; i += 1) {
    mw({ ip: '203.0.113.5' }, {}, (err) => errors.push(err));
  }
  return errors;
};

describe('RateLimit middleware (security-sensitive auth guard)', () => {
  it('allows requests below the limit', () => {
    const mw = createRateLimiter({ windowMs: 60000, max: 3, keyPrefix: 't-under' });
    const errors = call(mw, 3);
    expect(errors).toHaveLength(3);
    errors.forEach((err) => expect(err).toBeUndefined());
  });

  it('rejects requests once the limit is exceeded with a 429', () => {
    const mw = createRateLimiter({ windowMs: 60000, max: 3, keyPrefix: 't-over' });
    const errors = call(mw, 5);
    expect(errors[0]).toBeUndefined();
    expect(errors[1]).toBeUndefined();
    expect(errors[2]).toBeUndefined();
    expect(errors[3]).toBeInstanceOf(Error);
    expect(errors[3].statusCode).toBe(429);
    expect(errors[4].statusCode).toBe(429);
  });

  it('keeps independent limits per key prefix', () => {
    const auth = createRateLimiter({ windowMs: 60000, max: 1, keyPrefix: 't-auth' });
    const otp = createRateLimiter({ windowMs: 60000, max: 2, keyPrefix: 't-otp' });

    const authErrors = call(auth, 2);
    expect(authErrors[0]).toBeUndefined();
    expect(authErrors[1].statusCode).toBe(429);

    // A separate limiter for another endpoint still has capacity.
    const otpErrors = call(otp, 2);
    expect(otpErrors[0]).toBeUndefined();
    expect(otpErrors[1]).toBeUndefined();
  });
});
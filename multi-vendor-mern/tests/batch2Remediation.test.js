import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import User from '../app/models/User.model.js';
import RefreshToken from '../app/models/RefreshToken.model.js';
import { accessSecret } from '../app/helpers/Jwt.helper.js';

// ---------------------------------------------------------------------------
// Batch 2 remediation regression tests (M-024, M-025, M-030, M-031)
// ---------------------------------------------------------------------------

let seq = 0;
const uniqueEmail = (prefix = 'batch2') => {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}@example.com`;
};

const validRegister = (overrides = {}) => ({
  name: 'Batch Two User',
  email: uniqueEmail(),
  password: 'Password123',
  ...overrides,
});

const register = (body) => request(app).post('/api/v1/auth/register').send(body);
const login = (body) => request(app).post('/api/v1/auth/login').send(body);
const refresh = (body) => request(app).post('/api/v1/auth/refresh-token').send(body);

describe('Batch 2 remediation regressions', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  // -------------------------------------------------------------------------
  // M-024 — avatar upload limit / message consistency
  // -------------------------------------------------------------------------
  describe('M-024 avatar upload limits', () => {
    it('accepts an avatar within the configured 5 MB limit', async () => {
      const body = validRegister();
      const reg = await register(body).expect(201);
      const token = reg.body.data.accessToken;

      // Small valid PNG (1x1 pixel)
      const smallPng = Buffer.from(
        '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63fcffff3f030005fe02fea72d1e480000000049454e44ae426082',
        'hex'
      );

      const res = await request(app)
        .put('/api/v1/account/avatar')
        .set('Authorization', `Bearer ${token}`)
        .attach('avatar', smallPng, { filename: 'avatar.png', contentType: 'image/png' })
        .expect(200);

      expect(res.body.data.avatar).toMatch(/^\/uploads\//);
    });

    it('rejects an oversized avatar with a message matching the 5 MB limit', async () => {
      const body = validRegister();
      const reg = await register(body).expect(201);
      const token = reg.body.data.accessToken;

      // > 5 MB of bytes with a .png extension
      const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024, 7);

      const res = await request(app)
        .put('/api/v1/account/avatar')
        .set('Authorization', `Bearer ${token}`)
        .attach('avatar', bigBuffer, { filename: 'avatar.png', contentType: 'image/png' })
        .expect(400);

      expect(res.body.message).toBe('File too large. Maximum size is 5 MB.');
    });
  });

  // -------------------------------------------------------------------------
  // M-025 — JWT fallback secrets
  // -------------------------------------------------------------------------
  describe('M-025 JWT secret configuration', () => {
    it('fails fast when JWT_ACCESS_SECRET is missing (no predictable fallback)', async () => {
      const original = process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_ACCESS_SECRET;
      try {
        expect(() => accessSecret()).toThrow('JWT_ACCESS_SECRET is not configured');
      } finally {
        if (original !== undefined) process.env.JWT_ACCESS_SECRET = original;
      }
    });

    it('still issues and verifies tokens when secrets are configured', async () => {
      const body = validRegister();
      const reg = await register(body).expect(201);
      const { accessToken, refreshToken } = reg.body.data;

      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');

      const res = await request(app)
        .get('/api/v1/account/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body.data.email).toBe(body.email.toLowerCase());
    });
  });

  // -------------------------------------------------------------------------
  // M-030 — password change revokes refresh-token sessions
  // -------------------------------------------------------------------------
  describe('M-030 password change revokes refresh tokens', () => {
    it('invalidates outstanding refresh tokens after a password change', async () => {
      const body = validRegister();
      const reg = await register(body).expect(201);
      const { accessToken, refreshToken } = reg.body.data;

      // The refresh token is usable before the password change.
      await refresh({ refreshToken }).expect(200);

      // Re-login to obtain a fresh refresh token (the previous one was rotated).
      const relogin = await login({ email: body.email, password: body.password }).expect(200);
      const oldRefreshToken = relogin.body.data.refreshToken;

      // Change the password.
      await request(app)
        .put('/api/v1/account/password')
        .set('Authorization', `Bearer ${relogin.body.data.accessToken}`)
        .send({ currentPassword: body.password, newPassword: 'NewPassword456' })
        .expect(200);

      // The old refresh token must now be rejected.
      const rejected = await refresh({ refreshToken: oldRefreshToken }).expect(401);
      expect(rejected.body.message).toBe('Invalid or expired refresh token');

      // No refresh tokens remain for the user.
      const dbUser = await User.findOne({ email: body.email.toLowerCase() }).lean();
      const storedTokens = await RefreshToken.countDocuments({ user: dbUser._id });
      expect(storedTokens).toBe(0);

      // A fresh login with the new password issues a usable session.
      const newLogin = await login({ email: body.email, password: 'NewPassword456' }).expect(200);
      expect(typeof newLogin.body.data.refreshToken).toBe('string');
      await refresh({ refreshToken: newLogin.body.data.refreshToken }).expect(200);

      // The old password no longer works.
      await login({ email: body.email, password: body.password }).expect(401);
    });

    it('still rejects an invalid refresh token after a password change', async () => {
      const body = validRegister();
      const reg = await register(body).expect(201);

      await request(app)
        .put('/api/v1/account/password')
        .set('Authorization', `Bearer ${reg.body.data.accessToken}`)
        .send({ currentPassword: body.password, newPassword: 'NewPassword456' })
        .expect(200);

      const res = await refresh({ refreshToken: 'not-a-jwt' }).expect(401);
      expect(res.body.message).toBe('Invalid or expired refresh token');
    });
  });

  // -------------------------------------------------------------------------
  // M-031 � profile update response sanitization
  // -------------------------------------------------------------------------
  describe('M-031 updateProfile response sanitization', () => {
    it('returns only profile contract fields and excludes internal data', async () => {
      const body = validRegister();
      const reg = await register(body).expect(201);
      const token = reg.body.data.accessToken;

      const res = await request(app)
        .put('/api/v1/account/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Renamed User', avatar: '/uploads/products/x.png' })
        .expect(200);

      const profile = res.body.data;

      expect(profile.name).toBe('Renamed User');
      expect(profile.email).toBe(body.email.toLowerCase());
      expect(profile.avatar).toBe('/uploads/products/x.png');
      expect(profile.role).toBe('Customer');

      expect(profile.password).toBeUndefined();
      expect(profile.googleId).toBeUndefined();
      expect(profile.isVerified).toBeUndefined();
      expect(profile.createdAt).toBeUndefined();
      expect(profile.updatedAt).toBeUndefined();
      expect(profile.__v).toBeUndefined();
    });
  });
});

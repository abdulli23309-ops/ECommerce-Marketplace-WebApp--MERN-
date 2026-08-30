import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import User from '../../app/models/User.model.js';
import RefreshToken from '../../app/models/RefreshToken.model.js';

const googleLogin = (body) => request(app).post('/api/v1/auth/google').send(body);
const refresh = (body) => request(app).post('/api/v1/auth/refresh-token').send(body);

const mockGooglePayload = (overrides = {}) => ({
  idToken: 'mock-google-token',
  email: `google-${Date.now()}@example.com`,
  name: 'Google User',
  sub: `google-sub-${Date.now()}`,
  email_verified: true,
  ...overrides,
});

describe('Priority 5 — Google Authentication', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('creates a new Google user as Customer only', async () => {
    const res = await googleLogin(mockGooglePayload()).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('Customer');

    const savedUser = await User.findOne({ email: res.body.data.user.email });
    expect(savedUser.googleId).toBeTruthy();
    expect(savedUser.role).toBe('Customer');
  });

  it('rejects Google token without verified email', async () => {
    await googleLogin(mockGooglePayload({ email_verified: false })).expect(401);
  });

  it('links Google ID to existing user without changing role', async () => {
    const existingUser = await User.create({
      name: 'Existing User',
      email: `google-existing-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    await googleLogin({
      idToken: 'mock-google-token',
      email: existingUser.email,
      email_verified: true,
      sub: `google-existing-id-${Date.now()}`,
    }).expect(200);

    const updatedUser = await User.findById(existingUser._id);
    expect(updatedUser.googleId).toBeTruthy();
    expect(updatedUser.role).toBe('Seller');
  });

  // =========== M-005 REGRESSION TESTS ===========

  it('M-005: returns both accessToken and refreshToken for new Google user', async () => {
    const res = await googleLogin(mockGooglePayload()).expect(200);

    const { tokens } = res.body.data;
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
    expect(tokens.refreshToken.length).toBeGreaterThan(10);

    // A refresh-token row is persisted so the session can be rotated later.
    const stored = await RefreshToken.countDocuments();
    expect(stored).toBe(1);
  });

  it('M-005: returns both accessToken and refreshToken for existing linked Google user', async () => {
    const first = await googleLogin(mockGooglePayload()).expect(200);
    expect(typeof first.body.data.tokens.refreshToken).toBe('string');

    // Re-authenticate with the same Google identity (simulating a return visit).
    const second = await googleLogin(mockGooglePayload({
      email: first.body.data.user.email,
      sub: first.body.data.user.googleId,
    })).expect(200);

    expect(typeof second.body.data.tokens.accessToken).toBe('string');
    expect(typeof second.body.data.tokens.refreshToken).toBe('string');
  });

  it('M-005: refresh using the Google-authenticated user refresh token works', async () => {
    const loginRes = await googleLogin(mockGooglePayload()).expect(200);
    const { refreshToken } = loginRes.body.data.tokens;

    const res = await refresh({ refreshToken }).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Token refreshed');
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');
    // New refresh token issued via rotation.
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('M-005: invalid/expired refresh token is rejected with 401', async () => {
    const res = await refresh({ refreshToken: 'not-a-valid-jwt' }).expect(401);
    expect(res.body.message).toBe('Invalid or expired refresh token');
  });

  it('M-005: normal email/password login remains unaffected', async () => {
    const user = await User.create({
      name: 'Normal User',
      email: `normal-${Date.now()}@example.com`,
      password: 'Password123',
      role: 'Customer',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Password123' })
      .expect(200);

    expect(typeof res.body.data.accessToken).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');
  });
});
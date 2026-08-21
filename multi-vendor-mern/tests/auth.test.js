import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import User from '../app/models/User.model.js';
import RefreshToken from '../app/models/RefreshToken.model.js';

// Monotonic suffix keeps generated emails unique within and across tests.
let seq = 0;
const uniqueEmail = (prefix = 'auth') => {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}@example.com`;
};

// A registration body that passes every validator. The register validator
// requires a lowercase letter, an uppercase letter and a digit, so the literal
// 'password123' (no uppercase) would fail — 'Password123' is the minimum valid.
const validRegister = (overrides = {}) => ({
  name: 'Test User',
  email: uniqueEmail(),
  password: 'Password123',
  ...overrides,
});

const register = (body) => request(app).post('/api/v1/auth/register').send(body);
const login = (body) => request(app).post('/api/v1/auth/login').send(body);
const refresh = (body) => request(app).post('/api/v1/auth/refresh-token').send(body);
const logout = (body) => request(app).post('/api/v1/auth/logout').send(body);

describe('Auth API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers a new customer and issues a session', async () => {
      const body = validRegister();
      const res = await register(body).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Registration successful');
      // Registration always creates a Customer, never a privileged role.
      expect(res.body.data.user.roles).toEqual(['Customer']);
      expect(res.body.data.user.email).toBe(body.email.toLowerCase());
      expect(res.body.data.user.emailVerified).toBe(false);
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(typeof res.body.data.refreshToken).toBe('string');
      expect(res.body.data.user.password).toBeUndefined();

      // A refresh-token row is persisted so the session can be rotated later.
      const stored = await RefreshToken.countDocuments();
      expect(stored).toBe(1);
      // The user was created with the Customer role.
      const dbUser = await User.findOne({ email: body.email.toLowerCase() }).lean();
      expect(dbUser.role).toBe('Customer');
    });

    it('rejects a duplicate email with 409', async () => {
      const body = validRegister();
      await register(body).expect(201);

      const res = await register({ ...body, name: 'Someone Else' }).expect(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already registered');
    });

    it('treats the email as case-insensitive when detecting duplicates', async () => {
      const mixed = `Case-${Date.now()}@Example.com`;
      await register(validRegister({ email: mixed })).expect(201);

      const res = await register(validRegister({ email: mixed.toLowerCase() })).expect(409);
      expect(res.body.message).toBe('Email already registered');
    });

    it('rejects a weak password that has no uppercase letter (validation)', async () => {
      const res = await register(validRegister({ password: 'password123' })).expect(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('rejects a name that is too short (validation)', async () => {
      const res = await register(validRegister({ name: 'A' })).expect(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('rejects a malformed email (validation)', async () => {
      const res = await register(validRegister({ email: 'not-an-email' })).expect(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const body = validRegister();
      await register(body).expect(201);

      const res = await login({ email: body.email, password: body.password }).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data.user.email).toBe(body.email.toLowerCase());
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(typeof res.body.data.refreshToken).toBe('string');
    });

    it('rejects a wrong password with 401', async () => {
      const body = validRegister();
      await register(body).expect(201);

      const res = await login({ email: body.email, password: 'WrongPassword9' }).expect(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('rejects an unknown email with 401', async () => {
      const res = await login({ email: uniqueEmail('nobody'), password: 'Password123' }).expect(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('rejects an inactive account with 403', async () => {
      const body = validRegister();
      await register(body).expect(201);
      await User.updateOne({ email: body.email.toLowerCase() }, { isActive: false });

      const res = await login({ email: body.email, password: body.password }).expect(403);
      expect(res.body.message).toBe('This account is inactive');
    });

    it('rejects login with a missing password (validation)', async () => {
      const res = await login({ email: uniqueEmail('x') }).expect(400);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('issues a fresh session for a valid refresh token', async () => {
      const reg = await register(validRegister()).expect(201);
      const { refreshToken } = reg.body.data;

      const res = await refresh({ refreshToken }).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Token refreshed');
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(typeof res.body.data.refreshToken).toBe('string');
    });

    it('invalidates a refresh token after a single use (rotation)', async () => {
      const reg = await register(validRegister()).expect(201);
      const { refreshToken } = reg.body.data;

      await refresh({ refreshToken }).expect(200); // consumes the token
      const res = await refresh({ refreshToken }).expect(401); // reuse is rejected
      expect(res.body.message).toBe('Invalid or expired refresh token');
    });

    it('rejects a malformed refresh token with 401', async () => {
      const res = await refresh({ refreshToken: 'not-a-jwt' }).expect(401);
      expect(res.body.message).toBe('Invalid or expired refresh token');
    });

    it('rejects a missing refresh token with 400 (validation)', async () => {
      const res = await refresh({}).expect(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'refreshToken')).toBe(true);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('logs out and prevents the refresh token from being reused', async () => {
      const reg = await register(validRegister()).expect(201);
      const { refreshToken } = reg.body.data;

      const res = await logout({ refreshToken }).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
      expect(res.body.data).toBeNull();

      // The token was consumed, so a subsequent refresh must fail.
      const after = await refresh({ refreshToken }).expect(401);
      expect(after.body.message).toBe('Invalid or expired refresh token');
    });

    it('is idempotent when no refresh token is supplied', async () => {
      const res = await logout({}).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });
});

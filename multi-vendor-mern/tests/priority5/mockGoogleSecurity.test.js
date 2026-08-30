import mongoose from 'mongoose';
import { cleanDb } from '../helpers/testDb.js';
import User from '../../app/models/User.model.js';
import RefreshToken from '../../app/models/RefreshToken.model.js';
import { authenticateWithGoogle } from '../../app/services/GoogleAuth.service.js';

/**
 * M-008 — Mock-Google OAuth security.
 *
 * The mock authentication path must be a strict test/development convenience
 * and must NEVER become a production authentication bypass. These tests
 * exercise the service directly with controlled NODE_ENV / ALLOW_MOCK_GOOGLE
 * states so a production-like configuration can be proven safe.
 */

const OLD_ENV = { ...process.env };

const setEnv = (overrides) => {
  process.env = { ...OLD_ENV, ...overrides };
};

const mockPayload = (overrides = {}) => ({
  idToken: 'mock-google-token',
  email: `m008-${Date.now()}@example.com`,
  name: 'Mock User',
  sub: `m008-sub-${Date.now()}`,
  email_verified: true,
  ...overrides,
});

describe('M-008 — Mock-Google OAuth security', () => {
  beforeEach(async () => {
    await cleanDb();
    // Restore a known-good baseline before each test.
    setEnv({ NODE_ENV: 'test', ALLOW_MOCK_GOOGLE: undefined });
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('M-008: mock Google auth works when explicitly enabled (test config)', async () => {
    const res = await authenticateWithGoogle(mockPayload());

    expect(res.user.email).toBeTruthy();
    expect(res.user.role).toBe('Customer');
    expect(typeof res.tokens.accessToken).toBe('string');
    expect(typeof res.tokens.refreshToken).toBe('string');

    // A mock identity created only while mock is enabled.
    const saved = await User.findOne({ email: res.user.email });
    expect(saved).not.toBeNull();
  });

  it('M-008: arbitrary mock identity is rejected when mock auth is disabled', async () => {
    // Production NODE_ENV without the mock flag → mock disabled.
    setEnv({ NODE_ENV: 'production', ALLOW_MOCK_GOOGLE: undefined });

    await expect(
      authenticateWithGoogle(mockPayload())
    ).rejects.toMatchObject({ statusCode: 401, message: 'Mock authentication is not enabled' });

    // Nothing was persisted.
    expect(await User.countDocuments()).toBe(0);
    expect(await RefreshToken.countDocuments()).toBe(0);
  });

  it('M-008: production-like config cannot accidentally enable mock (flag ignored in prod)', async () => {
    // Even if ALLOW_MOCK_GOOGLE=true leaks into a production env, the
    // fail-safe must keep mock off — the flag is ignored under NODE_ENV=production.
    setEnv({ NODE_ENV: 'production', ALLOW_MOCK_GOOGLE: 'true' });

    await expect(
      authenticateWithGoogle(mockPayload())
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(await User.countDocuments()).toBe(0);
  });

  it('M-008: real Google path remains unaffected (non-mock token verified)', async () => {
    // Parade a non-mock token through the enabled path: it must go through
    // real verification, not be trusted from the client body.
    setEnv({ NODE_ENV: 'test', ALLOW_MOCK_GOOGLE: undefined });

    const originalFetch = global.fetch;
    const realUser = {
      email: `real-${Date.now()}@example.com`,
      name: 'Real Google User',
      sub: `real-sub-${Date.now()}`,
      email_verified: true,
      picture: null,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => realUser,
    });

    try {
      const res = await authenticateWithGoogle({
        idToken: 'eyJhbGciOiJSUzI1NiJ9.real-signed-id-token',
      });
      expect(res.user.email).toBe(realUser.email);
      expect(res.user.googleId).toBe(realUser.sub);
      // The client-supplied email was NOT trusted — the verified value was used.
      expect(global.fetch).toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('M-008: mock auth is available under explicit ALLOW_MOCK_GOOGLE=true (dev opt-in)', async () => {
    // A dev-like config: NODE_ENV=development + explicit flag → mock works.
    setEnv({ NODE_ENV: 'development', ALLOW_MOCK_GOOGLE: 'true' });

    const res = await authenticateWithGoogle(mockPayload());
    expect(res.user.email).toBeTruthy();
    expect(typeof res.tokens.refreshToken).toBe('string');
  });
});

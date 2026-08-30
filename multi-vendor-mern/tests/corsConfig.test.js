import { describe, it, expect, vi, afterEach } from 'vitest';

// M-014: CORS allow-list must be configurable via the CORS_ORIGINS environment
// variable (comma-separated) so deployments are not locked to localhost.
// The config module evaluates process.env.CORS_ORIGINS at import time, so each
// test resets the module cache and dynamically imports app.conf.js to pick up
// the desired env value.

describe('M-014: CORS configuration via CORS_ORIGINS env', () => {
  const originalCorsOrigins = process.env.CORS_ORIGINS;

  afterEach(() => {
    if (originalCorsOrigins === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = originalCorsOrigins;
    }
    vi.resetModules();
  });

  it('falls back to localhost origins when CORS_ORIGINS is not set', async () => {
    delete process.env.CORS_ORIGINS;
    const { default: appConf } = await import('../app/config/app.conf.js');

    expect(appConf.cors.origin).toEqual(['http://localhost:5173', 'http://localhost:3000']);
    expect(appConf.cors.credentials).toBe(true);
  });

  it('falls back to localhost when CORS_ORIGINS is an empty string', async () => {
    process.env.CORS_ORIGINS = '';
    const { default: appConf } = await import('../app/config/app.conf.js');

    expect(appConf.cors.origin).toEqual(['http://localhost:5173', 'http://localhost:3000']);
  });

  it('uses CORS_ORIGINS when set to a single production origin', async () => {
    process.env.CORS_ORIGINS = 'https://vendorverse.com';
    const { default: appConf } = await import('../app/config/app.conf.js');

    expect(appConf.cors.origin).toEqual(['https://vendorverse.com']);
    expect(appConf.cors.credentials).toBe(true);
  });

  it('parses multiple comma-separated origins and trims whitespace', async () => {
    process.env.CORS_ORIGINS =
      '  https://vendorverse.com,  https://admin.vendorverse.com ,https://api.vendorverse.com  ';
    const { default: appConf } = await import('../app/config/app.conf.js');

    expect(appConf.cors.origin).toEqual([
      'https://vendorverse.com',
      'https://admin.vendorverse.com',
      'https://api.vendorverse.com',
    ]);
  });
});
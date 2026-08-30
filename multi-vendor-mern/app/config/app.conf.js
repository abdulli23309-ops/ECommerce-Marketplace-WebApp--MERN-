import appKeys from './app.keys.js';

// M-014: parse a comma-separated CORS_ORIGINS env value into an origin array.
// Blank/missing input yields an empty array (caller applies the dev fallback).
const parseCorsOrigins = (value) =>
  (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export default {
  ...appKeys,
  cors: {
    // M-014: allowed origins are deployment configuration, not code.
    // Set CORS_ORIGINS as a comma-separated list in the environment for
    // production; the localhost list is only a development fallback.
    origin: parseCorsOrigins(process.env.CORS_ORIGINS).length > 0
      ? parseCorsOrigins(process.env.CORS_ORIGINS)
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
};

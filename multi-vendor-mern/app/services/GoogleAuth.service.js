import User from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.util.js';
import { hashToken, getRefreshTokenExpiry, generateAccessToken, generateRefreshToken } from '../helpers/Jwt.helper.js';
import { createRefreshToken } from '../repositories/Auth.repository.js';

const verifyRealGoogleToken = async (idToken) => {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    throw new ApiError(401, 'Invalid Google token');
  }

  const data = await response.json();

  if (!data.email || !data.email_verified) {
    throw new ApiError(401, 'Google email is not verified');
  }

  return {
    email: data.email,
    name: data.name,
    sub: data.sub,
    email_verified: data.email_verified,
    picture: data.picture || null,
  };
};

/**
 * Determines whether mock Google authentication is enabled.
 * Mock mode is a test/development convenience and MUST NEVER be active in a
 * production environment. Even an explicit ALLOW_MOCK_GOOGLE=true does not
 * override NODE_ENV=production — that is the fail-safe that keeps the mock
 * flag from silently becoming a production authentication bypass.
 */
const isMockGoogleAuthEnabled = () => {
  if (process.env.NODE_ENV === 'production') return false;
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.ALLOW_MOCK_GOOGLE === 'true'
  );
};

export const authenticateWithGoogle = async (googlePayload) => {
  const {
    idToken,
    email,
    name,
    sub,
    email_verified,
    picture,
  } = googlePayload;

  let googleUser;

  // ----- DEV / TEST MOCK MODE -----
  // Mock mode runs ONLY when explicitly enabled (test NODE_ENV or
  // ALLOW_MOCK_GOOGLE=true) AND the process is NOT production. When mock
  // mode is disabled, a mock-shaped token is rejected outright rather than
  // being treated as a real identity — it must never be accepted.
  if (isMockGoogleAuthEnabled()) {
    if (!idToken || !idToken.startsWith('mock')) {
      // If a real token is provided, verify it against Google.
      googleUser = await verifyRealGoogleToken(idToken);
    } else {
      // Mock token payload can be passed manually from frontend/Postman.
      googleUser = {
        email: email || `mock-google-${Date.now()}@example.com`,
        name: name || 'Mock Google User',
        sub: sub || `mock-google-${Date.now()}`,
        email_verified: email_verified !== false,
        picture: picture || null,
      };
    }
  } else if (idToken && idToken.startsWith('mock')) {
    // Fail-safe: mock authentication is disabled; a supplied mock identity
    // is rejected rather than trusted.
    throw new ApiError(401, 'Mock authentication is not enabled');
  } else {
    // ----- PRODUCTION / REAL GOOGLE VERIFICATION -----
    googleUser = await verifyRealGoogleToken(idToken);
  }

  if (!googleUser.email || !googleUser.email_verified) {
    throw new ApiError(401, 'Google email is not verified');
  }

  let user = await User.findOne({
    $or: [{ googleId: googleUser.sub }, { email: googleUser.email }],
  });

  if (user) {
    // Link Google ID to existing account if missing.
    if (!user.googleId) {
      user.googleId = googleUser.sub;
    }

    // Import Google profile picture if the user has no avatar yet.
    if (!user.avatar && googleUser.picture) {
      user.avatar = googleUser.picture;
    }

    // Google verifies the email, so mark it verified here.
    user.emailVerified = true;

    await user.save();

    const accessToken = generateAccessToken(user._id, user.role, []);
    const refreshToken = generateRefreshToken(user._id);
    await createRefreshToken(user._id, hashToken(refreshToken), getRefreshTokenExpiry());

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  // Create new Customer user from Google account.
  const newUser = await User.create({
    name: googleUser.name || googleUser.email.split('@')[0],
    email: googleUser.email,
    password: 'google-auth-random-password',
    role: 'Customer',
    googleId: googleUser.sub,
    isVerified: true,
    emailVerified: true,
    avatar: googleUser.picture || null,
  });

  const accessToken = generateAccessToken(newUser._id, 'Customer', []);
  const refreshToken = generateRefreshToken(newUser._id);
  await createRefreshToken(newUser._id, hashToken(refreshToken), getRefreshTokenExpiry());

  return {
    user: newUser,
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};
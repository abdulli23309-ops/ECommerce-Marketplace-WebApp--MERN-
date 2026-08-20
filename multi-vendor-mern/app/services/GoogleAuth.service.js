import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.util.js';

const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'change_me_access',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

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
  // This block runs when:
  // NODE_ENV === 'test'
  // OR
  // ALLOW_MOCK_GOOGLE === 'true'
  //
  // You can enable mock mode locally by adding this to your backend .env:
  // ALLOW_MOCK_GOOGLE=true
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.ALLOW_MOCK_GOOGLE === 'true'
  ) {
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

    const accessToken = generateAccessToken({
      sub: user._id,
      roles: user.role ? [user.role] : [],
      permissions: [],
    });

    return {
      user,
      tokens: {
        accessToken,
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

  const accessToken = generateAccessToken({
    sub: newUser._id,
    roles: ['Customer'],
    permissions: [],
  });

  return {
    user: newUser,
    tokens: {
      accessToken,
    },
  };
};
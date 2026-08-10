import { verifyAccessToken } from '../helpers/Jwt.helper.js';
import { ApiError } from '../utils/ApiError.util.js';

const authenticate = (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new ApiError(401, 'Authentication required'));

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired access token'));
  }
};

export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));

    // roles can be plain strings (from JWT) or populated objects (from DB)
    const hasRole = req.user.roles.some(
      (r) => (typeof r === 'string' ? r : r.name) === requiredRole
    );

    if (!hasRole) {
      return next(
        new ApiError(403, `You must be a ${requiredRole} to perform this action`)
      );
    }
    next();
  };
};

const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!permissions.every((permission) => req.user.permissions.includes(permission))) {
    return next(new ApiError(403, 'Insufficient permissions'));
  }
  return next();
};

export { authenticate, requirePermission };
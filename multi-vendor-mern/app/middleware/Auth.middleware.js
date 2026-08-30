import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.util.js';
import { accessSecret } from '../helpers/Jwt.helper.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    // M-025: verify against the fail-fast access secret (no silent fallback
    // to a predictable default when JWT_ACCESS_SECRET is missing).
    const decoded = jwt.verify(token, accessSecret());

    req.user = {
      id: decoded.sub,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    next(new ApiError(401, 'Authentication required'));
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  const userRoles = req.user?.roles || [];
  const isAdmin =
    userRoles.includes('Admin') || userRoles.includes('SuperAdmin');

  const hasRequiredRole =
    roles.some((role) => userRoles.includes(role)) || isAdmin;

  if (!hasRequiredRole) {
    return next(new ApiError(403, `You must be a ${roles.join(' or ')}`));
  }

  next();
};

export const requirePermission = (...permissions) => (req, res, next) => {
  const userPermissions = req.user?.permissions || [];

  if (userPermissions.includes('*')) {
    return next();
  }

  const hasPermission = permissions.every((permission) =>
    userPermissions.includes(permission)
  );

  if (!hasPermission) {
    return next(new ApiError(403, 'Insufficient permissions'));
  }

  next();
};
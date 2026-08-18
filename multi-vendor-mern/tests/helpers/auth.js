import jwt from 'jsonwebtoken';

export const generateTestToken = ({
  sub,
  roles = [],
  permissions = [],
}) => {
  return jwt.sign(
    { sub, roles, permissions },
    process.env.JWT_ACCESS_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};
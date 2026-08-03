const authenticatedAccess = (user) => ({ user });

const roleAccess = (user, role) => ({ user, requiredRole: role });

const permissionAccess = (user, permission) => ({ user, requiredPermission: permission });

export { authenticatedAccess, permissionAccess, roleAccess };

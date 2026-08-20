import { useSelector } from "react-redux";

const PermissionGate = ({ permission, children }) => {
  const { user } = useSelector((state) => state.auth);
  const { codes } = useSelector((state) => state.permissions);

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : [];

  const isAdmin = roles.includes("Admin") || roles.includes("SuperAdmin");

  const hasPermission =
    isAdmin || (codes && codes.includes(permission));

  if (!hasPermission) {
    return null;
  }

  return children;
};

export default PermissionGate;
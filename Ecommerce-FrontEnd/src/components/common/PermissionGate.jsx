import { useSelector } from "react-redux";

const PermissionGate = ({ permission, children, fallback = null }) => {
  const permissions = useSelector((state) => state.permissions.codes);

  if (!permissions || permissions.length === 0) {
    // Loading state – you can return null or a placeholder
    return null;
  }

  if (permissions.includes(permission)) {
    return children;
  }

  return fallback;
};

export default PermissionGate;
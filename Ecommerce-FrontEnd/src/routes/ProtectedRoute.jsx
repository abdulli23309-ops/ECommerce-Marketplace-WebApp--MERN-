import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const getRoles = (user, actualRole) => {
  const roles = new Set();

  if (!user) return roles;

  if (Array.isArray(user.roles)) {
    user.roles.forEach((role) => {
      if (typeof role === "string") {
        roles.add(role);
      } else if (role && typeof role === "object" && role.name) {
        roles.add(role.name);
      }
    });
  } else if (typeof user.roles === "string") {
    roles.add(user.roles);
  }

  if (user.role) {
    if (typeof user.role === "string") {
      roles.add(user.role);
    } else if (user.role && typeof user.role === "object" && user.role.name) {
      roles.add(user.role.name);
    }
  }

  if (actualRole) {
    roles.add(actualRole);
  }

  return roles;
};

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { accessToken, user } = useSelector((state) => state.auth);
  const { actualRole } = useSelector((state) => state.dashboardContext);
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0) {
    const roles = getRoles(user, actualRole);

    const isAdmin = roles.has("Admin") || roles.has("SuperAdmin");
    const isSeller = roles.has("Seller");

    // Admin/SuperAdmin can access any protected dashboard.
    if (isAdmin) {
      return <Outlet />;
    }

    // Seller can access Seller routes and Customer routes.
    const allowed = allowedRoles.some((role) => roles.has(role));

    // Seller may temporarily view Customer routes.
    const allowedSellerCustomer =
      isSeller && allowedRoles.includes("Customer");

    if (!allowed && !allowedSellerCustomer) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
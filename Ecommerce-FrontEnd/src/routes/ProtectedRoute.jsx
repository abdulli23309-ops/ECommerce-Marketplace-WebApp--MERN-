import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, accessToken } = useSelector((state) => state.auth);

  // DEBUGGING – remove after testing
  console.log('ProtectedRoute – user:', user);
  console.log('ProtectedRoute – allowedRoles:', allowedRoles);
  console.log('ProtectedRoute – accessToken:', accessToken);

  if (!accessToken) {
    console.log('No access token – redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  const hasRole =
    allowedRoles.length === 0 ||
    user?.roles?.some((role) => allowedRoles.includes(role));

  console.log('hasRole:', hasRole);

  if (!hasRole) {
    console.log('Missing role – redirecting to /');
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
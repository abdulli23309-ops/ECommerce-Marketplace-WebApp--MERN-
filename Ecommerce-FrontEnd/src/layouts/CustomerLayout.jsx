import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { loadCart } from "../store/cartSlice";
import { setActiveDashboard } from "../store/dashboardContextSlice";
import BrandLogo from "../components/common/BrandLogo";
import Footer from "../components/common/Footer";
import ThemeToggle from "../components/common/ThemeToggle";
import NotificationDropdown from "../components/common/NotificationDropdown";
import { clearPermissions } from "../store/permissionsSlice";

const CustomerLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const cartItemCount = useSelector((state) => state.cart?.totalCount || 0);
  const { actualRole, activeDashboard } = useSelector(
    (state) => state.dashboardContext
  );

  useEffect(() => {
    if (user) {
      dispatch(loadCart());
    }
  }, [user, dispatch]);

  const roles = new Set();

  if (user) {
    if (Array.isArray(user.roles)) {
      user.roles.forEach((role) => {
        if (typeof role === "string") roles.add(role);
        else if (role && typeof role === "object" && role.name) roles.add(role.name);
      });
    } else if (typeof user.roles === "string") {
      roles.add(user.roles);
    }

    if (user.role) {
      if (typeof user.role === "string") roles.add(user.role);
      else if (user.role && typeof user.role === "object" && user.role.name) roles.add(user.role.name);
    }
  }

  if (actualRole) roles.add(actualRole);

  const isAdmin = roles.has("Admin") || roles.has("SuperAdmin");
  const isSeller = roles.has("Seller");
  const isPureCustomer = !!user && !isAdmin && !isSeller;
  const isCustomerContext = activeDashboard === "customer" || !activeDashboard;

  const returnToDashboard = (targetDashboard) => {
    dispatch(setActiveDashboard(targetDashboard));

    if (targetDashboard === "admin") navigate("/admin/dashboard");
    else if (targetDashboard === "seller") navigate("/seller/dashboard");
    else navigate("/");
  };

  // Active state styling using existing theme tokens
  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
    fontWeight: isActive ? 600 : undefined,
  });

  return (
    <div className="customer-layout">
      <header className="navbar">
        {/* Left: Brand */}
        <div className="navbar-brand-wrapper">
          <Link to="/" aria-label="VendorVerse home" className="navbar-brand">
            <BrandLogo variant="mark" className="navbar-mark" maxWidth="40px" />
            <BrandLogo
              variant="wordmark"
              className="navbar-wordmark"
              maxWidth="140px"
            />
          </Link>
        </div>

        {/* Center: Main navigation */}
        <nav className="navbar-center">
          <ul className="navbar-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/products">Shop</Link></li>

            {/* Become a Seller ONLY for guests or pure customers */}
            {(isPureCustomer || !user) && (
              <li>
                <Link to="/seller/register" className="dashboard-link">
                  Become a Seller
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Right: Utilities, return buttons, account */}
        <div className="navbar-actions">
          {user && isAdmin && isCustomerContext && (
            <button
              className="btn-return-dashboard"
              onClick={() => returnToDashboard("admin")}
            >
              Return to Admin
            </button>
          )}

          {user && isSeller && !isAdmin && isCustomerContext && (
            <button
              className="btn-return-dashboard"
              onClick={() => returnToDashboard("seller")}
            >
              Return to Seller
            </button>
          )}

          <ThemeToggle />
          <NotificationDropdown placement="down" linkEnabled={true} />

          <div
            className="navbar-cart"
            onClick={() => navigate("/cart")}
            role="button"
            tabIndex={0}
          >
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
            {cartItemCount > 0 && (
              <span className="navbar-cart-count">{cartItemCount}</span>
            )}
          </div>

          <div className="navbar-user-menu">
            {user ? (
              <div className="user-nav-links">
                <NavLink to="/orders" style={navLinkStyle} end>Orders</NavLink>
                <NavLink to="/profile" style={navLinkStyle}>Profile</NavLink>
                <NavLink to="/wishlist" style={navLinkStyle}>Wishlist</NavLink>
                <NavLink to="/reviews/my" style={navLinkStyle}>My Reviews</NavLink>
                <NavLink to="/returns" style={navLinkStyle}>Returns</NavLink>
              </div>
            ) : (
              <Link className="btn-login" to="/login">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default CustomerLayout;
import { Outlet, Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
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
  const location = useLocation();

  const { user } = useSelector((state) => state.auth);
  const cartItemCount = useSelector((state) => state.cart?.totalCount || 0);
  const { actualRole, activeDashboard } = useSelector(
    (state) => state.dashboardContext
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <header className="navbar glassmorphic">
        {/* Left: Brand & Mobile Hamburger */}
        <div className="navbar-brand-wrapper" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            className="mobile-hamburger"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: 'var(--text-primary)',
              display: 'none',
            }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
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
          <ul className="navbar-links" style={{ display: "flex", gap: "1.5rem", listStyle: "none" }}>
            <li>
              <NavLink to="/" className={({ isActive }) => `nav-link-indicator-wrapper ${isActive ? 'is-active' : ''}`} style={{ textDecoration: "none", color: "var(--text-primary)", fontSize: "0.95rem" }}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => `nav-link-indicator-wrapper ${isActive ? 'is-active' : ''}`} style={{ textDecoration: "none", color: "var(--text-primary)", fontSize: "0.95rem" }}>
                About
              </NavLink>
            </li>
            <li>
              <NavLink to="/products" className={({ isActive }) => `nav-link-indicator-wrapper ${isActive ? 'is-active' : ''}`} style={{ textDecoration: "none", color: "var(--text-primary)", fontSize: "0.95rem" }}>
                Shop
              </NavLink>
            </li>

            {/* Become a Seller ONLY for guests or pure customers */}
            {(isPureCustomer || !user) && (
              <li>
                <Link to="/seller/register" className="dashboard-link" style={{ textDecoration: "none", fontSize: "0.95rem" }}>
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
            style={{ position: "relative" }}
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
              <span key={cartItemCount} className="navbar-cart-count" style={{ animation: "cartPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
                {cartItemCount}
              </span>
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

      {/* Mobile Navigation Drawer */}
      <div
        className="mobile-menu-drawer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "280px",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 1100,
          padding: "2rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BrandLogo variant="wordmark" maxWidth="120px" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: "none", color: "var(--text-primary)", fontWeight: 600, fontSize: "1.05rem" }}>Home</Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: "none", color: "var(--text-primary)", fontWeight: 600, fontSize: "1.05rem" }}>About</Link>
          <Link to="/products" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: "none", color: "var(--text-primary)", fontWeight: 600, fontSize: "1.05rem" }}>Shop</Link>
          {(isPureCustomer || !user) && (
            <Link to="/seller/register" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: "none", color: "var(--primary)", fontWeight: 600, fontSize: "1.05rem" }}>Become a Seller</Link>
          )}
        </nav>
      </div>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 1099,
          }}
        />
      )}

                              <main
        style={{
          flex: 1,
          overflow: "visible",
          minHeight: "calc(100vh - 112px)",
          paddingBottom: "5rem",
          boxSizing: "border-box",
        }}
      >
        <div key={location.pathname} className="page-fade-slide">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CustomerLayout;
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { loadCart } from "../store/cartSlice";
import BrandLogo from "../components/common/BrandLogo";
import Footer from "../components/common/Footer";
import ThemeToggle from "../components/common/ThemeToggle";
import { clearPermissions } from "../store/permissionsSlice";

const CustomerLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const cartItemCount = useSelector((state) => state.cart?.totalCount || 0);

  useEffect(() => {
    if (user) {
      dispatch(loadCart());
    }
  }, [user, dispatch]);

  const userRoles = user?.roles || [];

  const getDashboardLink = () => {
    if (!user || userRoles.length === 0) return null;

    if (userRoles.includes("Admin") || userRoles.includes("SuperAdmin")) {
      return "/admin/dashboard";
    }

    if (userRoles.includes("Seller")) {
      return "/seller/dashboard";
    }

    return null;
  };

  const dashboardLink = getDashboardLink();
  const isCustomer = userRoles.includes("Customer");
  const isSeller = userRoles.includes("Seller");
  const isAdmin = userRoles.includes("Admin") || userRoles.includes("SuperAdmin");

  return (
    <div className="customer-layout">
      <header className="navbar">
        <Link
          to="/"
          className="navbar-brand"
          aria-label="VendorVerse home"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <BrandLogo variant="mark" className="navbar-mark" maxWidth="40px" />
          <BrandLogo variant="wordmark" className="navbar-wordmark" maxWidth="140px" />
        </Link>

        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/products">Shop</Link></li>

          {dashboardLink && (
            <li>
              <Link to={dashboardLink} className="dashboard-link">
                Dashboard
              </Link>
            </li>
          )}

          {/* Become a Seller link only for authenticated non-seller customers */}
          {user && !dashboardLink && !isSeller && !isAdmin && isCustomer && (
            <li>
              <Link to="/seller/register" className="dashboard-link">
                Become a Seller
              </Link>
            </li>
          )}
        </ul>

        <div className="navbar-actions">
          <ThemeToggle />

          {/* Cart is always available */}
          <div className="navbar-cart" onClick={() => navigate("/cart")}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Account links — Customer-only */}
          {isCustomer && (
            <div className="navbar-links">
              <Link to="/orders">Orders</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/reviews/my">Reviews</Link>
              <Link to="/returns">Returns</Link>
              <Link to="/wishlist">Wishlist</Link>
            </div>
          )}

          {/* Non-customer authenticated users get no customer links */}
          {user && !isCustomer && (
            <div className="navbar-links">
              <Link to="/profile">Profile</Link>
            </div>
          )}

          {/* Unauthenticated or empty roles */}
          {(!user || userRoles.length === 0) && (
            <div className="navbar-links">
              <Link to="/login">Sign In</Link>
            </div>
          )}
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
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { loadCart } from "../store/cartSlice";
import axiosInstance from "../services/axiosInstance";
import BrandLogo from "../components/common/BrandLogo";
import Footer from "../components/common/Footer";
import { clearPermissions } from '../store/permissionsSlice';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const cartItemCount = useSelector((state) => state.cart?.totalCount || 0);
  const [sellerStatus, setSellerStatus] = useState(null);

   useEffect(() => {
  if (user) {
    dispatch(loadCart());
  }
}, [user, dispatch]);

  
 

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.roles?.includes("SuperAdmin")) return "/admin/dashboard";
    if (user.roles?.includes("Seller")) {
      if (sellerStatus?.hasProfile && sellerStatus.status === "Approved") {
        return "/seller/dashboard";
      }
      if (sellerStatus?.hasProfile && sellerStatus.status === "Pending") {
        return "/seller/pending";
      }
    }
    return null;
  };

  const dashboardLink = getDashboardLink();

  return (
    <div className="customer-layout">
      <header className="navbar">
        <Link to="/" className="navbar-brand" aria-label="VendorVerse home">
          <BrandLogo variant="mark" className="navbar-mark" />
          <BrandLogo variant="wordmark" className="navbar-wordmark" />
        </Link>

        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/products">Shop</Link></li>
          {dashboardLink && (
            <li><Link to={dashboardLink} className="dashboard-link">Dashboard</Link></li>
          )}
          {user && !dashboardLink && !user.roles?.includes("Seller") && (
            <li><Link to="/seller/register" className="dashboard-link">Become a Seller</Link></li>
          )}
        </ul>

        <div className="navbar-actions">
          <div className="navbar-cart" onClick={() => navigate("/cart")}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {cartItemCount > 0 && <span className="navbar-cart-count">{cartItemCount}</span>}
          </div>

          {user ? (
  <div className="navbar-links">
    <Link to="/orders">Orders</Link>
    <Link to="/profile">Profile</Link>
    <Link to="/reviews/my">Reviews</Link>
    <Link to="/returns">Returns</Link> 
  </div>
) : (
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
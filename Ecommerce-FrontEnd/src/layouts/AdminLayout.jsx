import { Outlet, Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";
import BrandLogo from "../components/common/BrandLogo";
import Footer from "../components/common/Footer";
import useIdleLogout from '../hooks/useIdleLogout';
import { clearPermissions } from '../store/permissionsSlice';
import { setActiveDashboard } from '../store/dashboardContextSlice';
import ThemeToggle from "../components/common/ThemeToggle";
import NotificationDropdown from "../components/common/NotificationDropdown";

const SellerIcon = () => (
  <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CustomerIcon = () => (
  <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);

const LogOutIcon = () => (
  <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useIdleLogout();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("admin-sidebar-collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  };

  const [pendingSellers, setPendingSellers] = useState(0);
  const [pendingProducts, setPendingProducts] = useState(0);
  const [pendingReturns, setPendingReturns] = useState(0);
  const [pendingRefunds, setPendingRefunds] = useState(0);
  const [pendingAppeals, setPendingAppeals] = useState(0);

  const [dismissedSellers, setDismissedSellers] = useState(false);
  const [dismissedProducts, setDismissedProducts] = useState(false);
  const [dismissedReturns, setDismissedReturns] = useState(false);
  const [dismissedRefunds, setDismissedRefunds] = useState(false);

  const fetchAdminStats = async () => {
    try {
      const res = await axiosInstance.get('/admin/stats');
      const stats = res.data?.data || {};
      setPendingSellers(stats.pendingSellerApprovals ?? 0);
      setPendingProducts(stats.pendingProductApprovals ?? 0);
      setPendingReturns(stats.pendingReturns ?? 0);
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    }
  };

  const fetchPendingRefunds = async () => {
    try {
      const res = await axiosInstance.get('/admin/returns', { params: { status: 'SELLER_RECEIVED' } });
      const data = res.data?.data || res.data;
      const returns = Array.isArray(data) ? data : data.items || [];
      setPendingRefunds(returns.length);
    } catch (err) {
      console.error('Failed to fetch refunds pending count', err);
    }
  };

  const fetchPendingAppeals = async () => {
    try {
      const res = await axiosInstance.get('/admin/seller-appeals', {
        params: { status: 'Pending' },
      });
      const data = res.data?.data || res.data;
      const appeals = Array.isArray(data) ? data : data?.items || [];
      setPendingAppeals(appeals.length);
    } catch (err) {
      console.error('Failed to fetch pending appeals count', err);
    }
  };

  useEffect(() => {
    fetchAdminStats();
    fetchPendingRefunds();
    fetchPendingAppeals();
    const interval = setInterval(() => {
      fetchAdminStats();
      fetchPendingRefunds();
      fetchPendingAppeals();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Mobile sidebar: Escape-to-close + body scroll lock
  useEffect(() => {
    if (!sidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearPermissions());
    navigate("/login");
  };

  const headerHeight = 72;
  const location = useLocation();

  return (
    <>
      <div className="dashboard-layout">
        <button
          type="button"
          className="dashboard-menu-toggle"
          aria-label="Open navigation menu"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <aside className={`vv-sidebar ${sidebarOpen ? "is-open" : ""} ${isCollapsed ? "is-collapsed" : ""}`}>
          <button
            type="button"
            className="dashboard-sidebar-close"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <button
            type="button"
            className="sidebar-collapse-toggle"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapse}
          >
            {isCollapsed ? "›" : "‹"}
          </button>

          {/* 1. HEADER */}
          <div className="sidebar-header" style={{ height: `${headerHeight}px` }}>
            <Link
              to="/"
              aria-label="VendorVerse home"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                minWidth: 0,
                maxWidth: "100%",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <BrandLogo
                className="dashboard-brand-mark"
                variant="mark"
                style={{ maxWidth: "100%", height: "auto", flexShrink: 0 }}
              />
              <BrandLogo
                className="dashboard-brand-wordmark"
                variant="wordmark"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  flexShrink: 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              />
            </Link>

            <span className="sidebar-role-text">
              Admin
            </span>
          </div>

          {/* 2. SCROLLABLE MIDDLE */}
          <div className="sidebar-nav-scroll">
            <div className="sidebar-section-title">Menu</div>
            <NavLink to="/admin/dashboard" className="sidebar-item" data-tooltip="Dashboard">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7m-9 2v10m4-10v10" />
                </svg>
              </span>
              <span className="sidebar-text">Dashboard</span>
            </NavLink>

            <div className="sidebar-section-title">Management</div>
            <NavLink
              to="/admin/sellers"
              className="sidebar-item"
              onClick={() => setDismissedSellers(true)}
              data-tooltip="Sellers"
            >
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              <span className="sidebar-text">Sellers</span>
              {!dismissedSellers && pendingSellers > 0 && (
                <span className="notification-badge">
                  {pendingSellers}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/admin/seller-appeals"
              className="sidebar-item"
              data-tooltip="Seller Appeals"
            >
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </span>
              <span className="sidebar-text">Seller Appeals</span>
              {pendingAppeals > 0 && (
                <span className="notification-badge">
                  {pendingAppeals}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/admin/products"
              className="sidebar-item"
              onClick={() => setDismissedProducts(true)}
              data-tooltip="Products"
            >
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
              <span className="sidebar-text">Products</span>
              {!dismissedProducts && pendingProducts > 0 && (
                <span className="notification-badge">
                  {pendingProducts}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/admin/returns"
              className="sidebar-item"
              onClick={() => setDismissedReturns(true)}
              data-tooltip="Returns"
            >
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3-3m-3 3l3 3m8-3v1a4 4 0 01-4 4h-4a4 4 0 01-4-4v-1m1-4h.01" />
                </svg>
              </span>
              <span className="sidebar-text">Returns</span>
              {!dismissedReturns && pendingReturns > 0 && (
                <span className="notification-badge">
                  {pendingReturns}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/admin/refunds"
              className="sidebar-item"
              onClick={() => setDismissedRefunds(true)}
              data-tooltip="Refunds"
            >
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="sidebar-text">Refunds</span>
              {!dismissedRefunds && pendingRefunds > 0 && (
                <span className="notification-badge">
                  {pendingRefunds}
                </span>
              )}
            </NavLink>

            <NavLink to="/admin/orders" className="sidebar-item" data-tooltip="Orders">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              <span className="sidebar-text">Orders</span>
            </NavLink>

            <NavLink to="/admin/shipments" className="sidebar-item" data-tooltip="Shipments">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1zM13 16h6a1 1 0 001-1v-4a1 1 0 00-1-1h-5" />
                </svg>
              </span>
              <span className="sidebar-text">Shipments</span>
            </NavLink>

            <NavLink to="/admin/payments" className="sidebar-item" data-tooltip="Payments">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="sidebar-text">Payments</span>
            </NavLink>

            <NavLink to="/admin/coupons" className="sidebar-item" data-tooltip="Coupons">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5h14a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zm0 8h14a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3a1 1 0 011-1z" />
                </svg>
              </span>
              <span className="sidebar-text">Coupons</span>
            </NavLink>

            <div className="sidebar-section-title">System</div>
            <NavLink to="/admin/permission-groups" className="sidebar-item" data-tooltip="Permission Groups">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </span>
              <span className="sidebar-text">Permission Groups</span>
            </NavLink>

            <NavLink to="/admin/role-permission-groups" className="sidebar-item" data-tooltip="Role-Perm Groups">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              <span className="sidebar-text">Role-Perm Groups</span>
            </NavLink>

            <NavLink to="/admin/users" className="sidebar-item" data-tooltip="Users">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13.5 9a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                </svg>
              </span>
              <span className="sidebar-text">Users</span>
            </NavLink>

            <NavLink to="/admin/categories" className="sidebar-item" data-tooltip="Categories">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </span>
              <span className="sidebar-text">Categories</span>
            </NavLink>

            <NavLink to="/admin/brands" className="sidebar-item" data-tooltip="Brands">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </span>
              <span className="sidebar-text">Brands</span>
            </NavLink>

            <NavLink to="/admin/audit-logs" className="sidebar-item" data-tooltip="Audit Logs">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="sidebar-text">Audit Logs</span>
            </NavLink>
          </div>

          {/* 3. FIXED FOOTER */}
          <div className="sidebar-footer">
            <div className="sidebar-utilities">
              <NotificationDropdown placement="up" linkEnabled={false} />
              <ThemeToggle />
            </div>

            <div className="sidebar-role-switches">
              <button
                className="sidebar-item"
                data-tooltip="Switch to Seller"
                onClick={() => {
                  dispatch(setActiveDashboard('seller'));
                  navigate('/seller/dashboard');
                }}
              >
                <span className="sidebar-icon">
                  <SellerIcon />
                </span>
                <span className="sidebar-text">Switch to Seller</span>
              </button>

              <button
                className="sidebar-item"
                data-tooltip="Switch to Customer"
                onClick={() => {
                  dispatch(setActiveDashboard('customer'));
                  navigate('/');
                }}
              >
                <span className="sidebar-icon">
                  <CustomerIcon />
                </span>
                <span className="sidebar-text">Switch to Customer</span>
              </button>
            </div>

            <button className="sidebar-item logout-btn" data-tooltip="Sign Out" onClick={handleLogout}>
              <span className="sidebar-icon">
                <LogOutIcon />
              </span>
              <span className="sidebar-text">Sign Out</span>
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="dashboard-sidebar-scrim"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <main className="dashboard-main" style={{ overflow: "hidden" }}>
          <div key={location.pathname} className="sub-route-slide">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default AdminLayout;
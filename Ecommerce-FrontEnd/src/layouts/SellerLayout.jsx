import { Outlet, Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../services/axiosInstance";
import PermissionGate from "../components/common/PermissionGate";
import BrandLogo from "../components/common/BrandLogo";
import Footer from "../components/common/Footer";
import useIdleLogout from '../hooks/useIdleLogout';
import { clearPermissions } from '../store/permissionsSlice';
import { setActiveDashboard } from '../store/dashboardContextSlice';
import ThemeToggle from "../components/common/ThemeToggle";
import NotificationDropdown from "../components/common/NotificationDropdown";

const CustomerIcon = () => (
  <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);

const AdminIcon = () => (
  <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v10m4-10v10" />
  </svg>
);

const LogOutIcon = () => (
  <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const SellerLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useIdleLogout();

  const { actualRole } = useSelector((state) => state.dashboardContext);
  const location = useLocation();

  const [storeId, setStoreId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("seller-sidebar-collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("seller-sidebar-collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await axiosInstance.get("/stores/mine");
        if (res.data?.data) {
          setStoreId(res.data.data._id);
        } else {
          setStoreId(null);
        }
      } catch (err) {
        console.error("Failed to load store", err);
        setStoreId(null);
      }
    };
    fetchStore();
  }, []);

  const suspendedAllowlist = [
    "/seller/suspended",
    "/seller/appeals",
    "/seller/appeals/:id",
    "/seller/appeals/new",
    "/seller/shipments",
    "/seller/returns",
  ];

  useEffect(() => {
    const checkSuspensionAndRedirect = async () => {
      if (actualRole !== "Seller") return;

      try {
        const res = await axiosInstance.get("/seller/suspension");
        const payload = res.data?.data || res.data || {};
        const { suspended } = payload;
        if (suspended) {
          const path = window.location.pathname;
          const matchesAllowlist = suspendedAllowlist.some((pattern) => {
            if (pattern.includes(":id")) {
              const base = pattern.replace(/:id/, "");
              return path.startsWith(base);
            }
            return path === pattern;
          });

          if (!matchesAllowlist) {
            navigate("/seller/suspended", { replace: true });
          }
        }
      } catch (err) {
        console.debug("Could not check suspension status", err);
      }
    };

    checkSuspensionAndRedirect();
    const interval = setInterval(checkSuspensionAndRedirect, 30000);
    return () => clearInterval(interval);
  }, [actualRole, navigate]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingShipments, setPendingShipments] = useState(0);
  const [returnsActionCount, setReturnsActionCount] = useState(0);
  const [dismissedShipments, setDismissedShipments] = useState(false);
  const [dismissedReturns, setDismissedReturns] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/seller/orders/unread-count');
      const { count } = res.data.data || res.data;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/seller/dashboard');
      const stats = res.data?.data || {};
      setPendingShipments(stats.pendingShipments ?? 0);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
  }, []);

  const fetchReturnsActionCount = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/returns/seller');
      const returns = res.data?.data || res.data || [];
      const actionStatuses = ['PENDING_SELLER_REVIEW', 'ITEM_IN_TRANSIT'];
      const count = returns.filter(r => actionStatuses.includes(r.status)).length;
      setReturnsActionCount(count);
    } catch (err) {
      console.error('Failed to fetch returns count', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    fetchDashboardStats();
    fetchReturnsActionCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchDashboardStats();
      fetchReturnsActionCount();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchDashboardStats, fetchReturnsActionCount]);

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

  const handleOrdersClick = async () => {
    try {
      await axiosInstance.post('/seller/orders/mark-read');
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark orders as read', err);
    }
  };

  const handleShipmentsClick = () => setDismissedShipments(true);
  const handleReturnsClick = () => setDismissedReturns(true);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearPermissions());
    navigate("/login");
  };

  const headerHeight = 72;

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

          {/* 1. HEADER */}
          <div className="sidebar-header" style={{ height: `${headerHeight}px` }}>
            <Link aria-label="VendorVerse home" className="brand-container" to="/">
              <BrandLogo className="dashboard-brand-mark" variant="mark" style={{ width: "34px", height: "34px", minWidth: "34px", flexShrink: 0 }} />
              <div className="brand-text-wrapper">
                <BrandLogo className="dashboard-brand-wordmark" variant="wordmark" style={{ height: "20px", maxWidth: "120px", width: "auto" }} />
                <span className="sidebar-role-text">Seller</span>
              </div>
            </Link>

            <button
              type="button"
              className="sidebar-collapse-toggle collapse-toggle-btn"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleCollapse}
            >
              {isCollapsed ? "›" : "‹"}
            </button>
          </div>

          {/* 2. SCROLLABLE MIDDLE */}
          <div className="sidebar-nav-scroll">
            <div className="sidebar-section-title">Menu</div>
            <NavLink to="/seller/dashboard" className="sidebar-item" data-tooltip="Dashboard">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7m-9 2v10m4-10v10" />
                </svg>
              </span>
              <span className="sidebar-text">Dashboard</span>
            </NavLink>

            <div className="sidebar-section-title">Catalog & Orders</div>
            <NavLink to="/seller/products" className="sidebar-item" data-tooltip="Products">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
              <span className="sidebar-text">Products</span>
            </NavLink>

            <NavLink
              to="/seller/orders"
              className="sidebar-item"
              onClick={handleOrdersClick}
              data-tooltip="Orders"
            >
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 112 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              <span className="sidebar-text">Orders</span>
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/seller/shipments"
              className="sidebar-item"
              onClick={handleShipmentsClick}
              data-tooltip="Shipments"
            >
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1zM13 16h6a1 1 0 001-1v-4a1 1 0 00-1-1h-5" />
                </svg>
              </span>
              <span className="sidebar-text">Shipments</span>
              {!dismissedShipments && pendingShipments > 0 && (
                <span className="notification-badge">
                  {pendingShipments}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/seller/returns"
              className="sidebar-item"
              onClick={handleReturnsClick}
              data-tooltip="Returns"
            >
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3-3m-3 3l3 3m8-3v1a4 4 0 01-4 4h-4a4 4 0 01-4-4v-1m1-4h.01" />
                </svg>
              </span>
              <span className="sidebar-text">Returns</span>
              {!dismissedReturns && returnsActionCount > 0 && (
                <span className="notification-badge">
                  {returnsActionCount}
                </span>
              )}
            </NavLink>

            <div className="sidebar-section-title">Settings & Support</div>
            <NavLink to="/seller/reviews" className="sidebar-item" data-tooltip="Reviews">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </span>
              <span className="sidebar-text">Reviews</span>
            </NavLink>

            <NavLink to="/seller/appeals" className="sidebar-item" data-tooltip="Appeals">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </span>
              <span className="sidebar-text">Appeals</span>
            </NavLink>

            <NavLink to="/seller/settings" className="sidebar-item" data-tooltip="Settings">
              <span className="sidebar-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <span className="sidebar-text">Settings</span>
            </NavLink>

            {storeId && (
              <a
                href={`/store/${storeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-item"
                style={{ marginTop: "auto" }}
                data-tooltip="View Store"
              >
                <span className="sidebar-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
                <span className="sidebar-text">View Store</span>
              </a>
            )}
          </div>

          {/* 3. FIXED FOOTER */}
          <div className="sidebar-footer">
            <div className="sidebar-utilities">
              <NotificationDropdown placement="up" linkEnabled={false} />
              <ThemeToggle />
            </div>

            <div className="sidebar-role-switches">
              {actualRole === 'Admin' ? (
                <>
                  <button
                    className="sidebar-item"
                    data-tooltip="Admin Dashboard"
                    onClick={() => {
                      dispatch(setActiveDashboard('admin'));
                      navigate('/admin/dashboard');
                    }}
                  >
                    <span className="sidebar-icon">
                      <AdminIcon />
                    </span>
                    <span className="sidebar-text">Return to Admin Dashboard</span>
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
                </>
              ) : (
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
              )}
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

export default SellerLayout;
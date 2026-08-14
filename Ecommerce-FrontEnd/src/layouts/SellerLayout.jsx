import { Outlet, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../services/axiosInstance";
import PermissionGate from "../components/common/PermissionGate";
import BrandLogo from "../components/common/BrandLogo";
import Footer from "../components/common/Footer";
import useIdleLogout from '../hooks/useIdleLogout';
import { clearPermissions } from '../store/permissionsSlice';

const SellerLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useIdleLogout();
  const [storeId, setStoreId] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await axiosInstance.get("/stores/mine");
        if (res.data && res.data.data) {
          setStoreId(res.data.data._id);
        }
      } catch (err) {
        console.error("Failed to load store", err);
      }
    };
    fetchStore();
  }, []);

  // ---- Unread orders badge ----
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/seller/orders/unread-count');
      const { count } = res.data.data || res.data;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  }, []);

  // ---- Dashboard stats (pending shipments) ----
  const [pendingShipments, setPendingShipments] = useState(0);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/seller/dashboard');
      const stats = res.data?.data || {};
      setPendingShipments(stats.pendingShipments ?? 0);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
  }, []);

  // ---- Returns needing seller action ----
  const [returnsActionCount, setReturnsActionCount] = useState(0);

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
    }, 60000); // poll every 60s

    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchDashboardStats, fetchReturnsActionCount]);

  const handleOrdersClick = async () => {
    try {
      await axiosInstance.post('/seller/orders/mark-read');
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark orders as read', err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearPermissions());
    navigate("/login");
  };

  const headerHeight = 72;

  return (
    <>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          {/* Header – overflow‑proof */}
          <div
            style={{
              height: `${headerHeight}px`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              padding: "0 1.25rem",
              borderBottom: "1px solid #e5e7eb",
              boxSizing: "border-box",
              gap: "4px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                minWidth: 0,
                maxWidth: "100%",
              }}
            >
              <BrandLogo
                className="dashboard-brand-mark"
                variant="mark"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  flexShrink: 1,
                }}
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
            </div>

            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#4b5563",
                background: "#f3f4f6",
                padding: "2px 6px",
                borderRadius: "4px",
                lineHeight: 1,
                border: "1px solid #e5e7eb",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              Seller Panel
            </span>
          </div>

          {/* Navigation */}
          <nav className="dashboard-nav">
            <PermissionGate permission="Seller.Dashboard.View">
              <Link className="dashboard-nav-link" to="/seller/dashboard">
                <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7m-9 2v10m4-10v10" />
                </svg>
                Dashboard
              </Link>
            </PermissionGate>

            <PermissionGate permission="Seller.Products.View">
              <Link className="dashboard-nav-link" to="/seller/products">
                <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Products
              </Link>
            </PermissionGate>

            {/* Orders link with notification badge */}
            <PermissionGate permission="Seller.Orders.View">
              <Link
                className="dashboard-nav-link"
                to="/seller/orders"
                onClick={handleOrdersClick}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Orders
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            </PermissionGate>

            <PermissionGate permission="Seller.Orders.View">
              <Link
                className="dashboard-nav-link"
                to="/seller/shipments"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1zM13 16h6a1 1 0 001-1v-4a1 1 0 00-1-1h-5" />
                  </svg>
                  Shipments
                </span>
                {pendingShipments > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}>
                    {pendingShipments}
                  </span>
                )}
              </Link>
            </PermissionGate>

            {/* Returns with badge */}
            <PermissionGate permission="Seller.Orders.View">
              <Link
                className="dashboard-nav-link"
                to="/seller/returns"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Returns
                </span>
                {returnsActionCount > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}>
                    {returnsActionCount}
                  </span>
                )}
              </Link>
            </PermissionGate>

            <PermissionGate permission="Seller.Reviews.View">
              <Link className="dashboard-nav-link" to="/seller/reviews">
                <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Reviews
              </Link>
            </PermissionGate>

            <PermissionGate permission="Seller.Store.Manage">
              <Link className="dashboard-nav-link" to="/seller/settings">
                <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </PermissionGate>

            {storeId && (
              <a
                href={`/store/${storeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="dashboard-nav-link"
                style={{ marginTop: "auto" }}
              >
                <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Store
              </a>
            )}
          </nav>

          <div className="dashboard-footer">
            <button onClick={handleLogout} className="btn-logout">
              <svg className="dashboard-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <Outlet/>
        </main>
      </div>
      <Footer/>
    </>
  );
};

export default SellerLayout;
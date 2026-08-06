import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminStats } from "../../services/adminService";
import "./AdminDashboardPage.css";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then((data) => setStats(data))
      .catch((err) => console.error("Error fetching admin stats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading platform metrics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-dashboard-error">
        <p>Failed to load dashboard metrics. Please refresh the page.</p>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Users",
      value: stats.totalUsers ?? 0,
      to: "/admin/users",
      badge: "Accounts",
      badgeClass: "badge-blue",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Sellers",
      value: stats.totalSellers ?? 0,
      to: "/admin/sellers",
      badge: "Active",
      badgeClass: "badge-green",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Products",
      value: stats.totalProducts ?? 0,
      to: "/admin/products",
      badge: "Catalog",
      badgeClass: "badge-blue",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      label: "Orders",
      value: stats.totalOrders ?? 0,
      to: "/admin/orders",
      badge: "Total",
      badgeClass: "badge-purple",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),
    },
    {
      label: "Revenue",
      value: `PKR ${(stats.totalRevenue || 0).toLocaleString()}`,
      to: "/admin/orders",
      badge: "Gross",
      badgeClass: "badge-green",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Pending Sellers",
      value: stats.pendingSellerApprovals ?? 0,
      to: "/admin/sellers",
      badge: stats.pendingSellerApprovals > 0 ? "Action Required" : "Up to Date",
      badgeClass: stats.pendingSellerApprovals > 0 ? "badge-amber" : "badge-gray",
      highlight: stats.pendingSellerApprovals > 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    {
      label: "Pending Products",
      value: stats.pendingProductApprovals ?? 0,
      to: "/admin/products",
      badge: stats.pendingProductApprovals > 0 ? "Action Required" : "Up to Date",
      badgeClass: stats.pendingProductApprovals > 0 ? "badge-amber" : "badge-gray",
      highlight: stats.pendingProductApprovals > 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Pending Returns",
      value: stats.pendingReturns ?? 0,
      to: "/admin/returns",
      badge: stats.pendingReturns > 0 ? "Action Required" : "Up to Date",
      badgeClass: stats.pendingReturns > 0 ? "badge-rose" : "badge-gray",
      highlight: stats.pendingReturns > 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="admin-dashboard-container">
      {/* Header Bar */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">System Overview</h1>
          <p className="dashboard-subtitle">
            Marketplace health, store metrics, and pending approvals.
          </p>
        </div>
        <div className="dashboard-header-right">
          <span className="live-indicator">
            <span className="live-dot"></span> Realtime Sync
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className={`metric-card ${card.highlight ? "metric-card-highlight" : ""}`}
          >
            <div className="metric-card-top">
              <span className="metric-label">{card.label}</span>
              <div className="metric-icon-box">{card.icon}</div>
            </div>

            <div className="metric-value">{card.value}</div>

            <div className="metric-card-bottom">
              <span className={`status-badge ${card.badgeClass}`}>
                {card.badge}
              </span>
              <span className="metric-link-text">View details →</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Lower Workspace Area */}
      <div className="dashboard-lower-grid">
        {/* Left Column: Pending Queue */}
        <div className="dashboard-panel panel-large">
          <div className="panel-header">
            <h2 className="panel-title">Pending Approvals Queue</h2>
            <span className="panel-tag">
              {(stats.pendingSellerApprovals || 0) + (stats.pendingProductApprovals || 0)} Items
            </span>
          </div>
          <div className="panel-empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="empty-title">Queue is clear</p>
            <p className="empty-description">
              All seller accounts and product updates have been reviewed.
            </p>
            <div className="empty-actions">
              <Link to="/admin/sellers" className="btn-secondary">
                Manage Sellers
              </Link>
              <Link to="/admin/products" className="btn-secondary">
                Manage Products
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Status */}
        <div className="dashboard-panel panel-small">
          <div className="panel-header">
            <h2 className="panel-title">System Status</h2>
          </div>
          <div className="status-list">
            <div className="status-item">
              <span className="status-dot green"></span>
              <div className="status-info">
                <span className="status-name">Database (MongoDB)</span>
                <span className="status-sub">Operational</span>
              </div>
            </div>
            <div className="status-item">
              <span className="status-dot green"></span>
              <div className="status-info">
                <span className="status-name">Express API Server</span>
                <span className="status-sub">Connected</span>
              </div>
            </div>
            <div className="status-item">
              <span className="status-dot blue"></span>
              <div className="status-info">
                <span className="status-name">Authentication Service</span>
                <span className="status-sub">JWT Refresh Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
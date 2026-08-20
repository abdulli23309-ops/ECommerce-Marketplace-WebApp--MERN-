import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminStats } from "../../services/adminService";

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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", color: "var(--text-secondary)" }}>
        <div style={{ width: "28px", height: "28px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "12px" }}></div>
        <p>Loading platform metrics...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", color: "var(--text-secondary)" }}>
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
      badgeStyle: { background: "var(--info-bg)", color: "var(--info-text)" },
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
      badgeStyle: { background: "var(--success-bg)", color: "var(--success-text)" },
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
      badgeStyle: { background: "var(--info-bg)", color: "var(--info-text)" },
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
      badgeStyle: { background: "var(--info-bg)", color: "var(--info-text)" },
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
      badgeStyle: { background: "var(--success-bg)", color: "var(--success-text)" },
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
      badgeStyle: stats.pendingSellerApprovals > 0
        ? { background: "var(--warning-bg)", color: "var(--warning-text)" }
        : { background: "var(--bg-secondary)", color: "var(--text-secondary)" },
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
      badgeStyle: stats.pendingProductApprovals > 0
        ? { background: "var(--warning-bg)", color: "var(--warning-text)" }
        : { background: "var(--bg-secondary)", color: "var(--text-secondary)" },
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
      badgeStyle: stats.pendingReturns > 0
        ? { background: "var(--danger-bg)", color: "var(--danger-text)" }
        : { background: "var(--bg-secondary)", color: "var(--text-secondary)" },
      highlight: stats.pendingReturns > 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      padding: "24px",
      maxWidth: "1320px",
      margin: "0 auto",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "var(--text-primary)",
      backgroundColor: "var(--bg-secondary)",
      minHeight: "100vh",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>System Overview</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
            Marketplace health, store metrics, and pending approvals.
          </p>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "6px 14px", borderRadius: "20px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--success)" }}></span>
          Realtime Sync
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className={`metric-card ${card.highlight ? "metric-card-highlight" : ""}`}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                {card.label}
              </span>
              <div style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)", padding: "8px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {card.icon}
              </div>
            </div>

            <div style={{ fontSize: "1.625rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>
              {card.value}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "12px",
                background: card.badgeStyle.background,
                color: card.badgeStyle.color,
              }}>
                {card.badge}
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--info)" }}>View details →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
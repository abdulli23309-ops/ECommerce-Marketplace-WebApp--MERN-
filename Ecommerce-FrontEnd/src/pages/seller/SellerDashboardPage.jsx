import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { GridSkeleton } from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import { formatPKR } from "../../utils/currency";
import {
  SELLER_LOW_RATING_THRESHOLD,
  LOW_STOCK_THRESHOLD,
} from "../../utils/warningThresholds";

const Icon = ({ type }) => {
  const iconProps = {
    width: 24,
    height: 24,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
  };

  switch (type) {
    case "products":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case "approved":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case "pending":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "today":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case "month":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "revenue":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "shipments":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1zM13 16h6a1 1 0 001-1v-4a1 1 0 00-1-1h-5" />
        </svg>
      );
    case "rating":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case "low":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z" />
        </svg>
      );
    case "fulfilled":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "avgOrder":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "pendingReviews":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case "returnRate":
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        </svg>
      );
    default:
      return null;
  }
};

const SellerDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get("/seller/dashboard");
        setStats(res.data?.data || {});
      } catch (err) {
        console.error("Failed to load seller stats", err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "1.5rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
        <GridSkeleton count={4} style={{ marginBottom: "2.5rem" }} />
        <GridSkeleton count={8} style={{ marginBottom: "2.5rem" }} />
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.5rem", marginTop: "2.5rem" }}>
          <div style={{ height: "16px", width: "40%", background: "var(--border)", borderRadius: "4px", marginBottom: "1rem" }} />
          <div style={{ height: "80px", background: "var(--border)", borderRadius: "8px" }} />
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.5rem", marginTop: "2.5rem" }}>
          <div style={{ height: "16px", width: "40%", background: "var(--border)", borderRadius: "4px", marginBottom: "1rem" }} />
          <div style={{ height: "80px", background: "var(--border)", borderRadius: "8px" }} />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <ErrorState
        title="Could not load dashboard"
        body="We couldn't load your seller dashboard stats. Please try again."
        onRetry={() => window.location.reload()}
        style={{ padding: "1.5rem" }}
      />
    );
  }

  // Cards with warning flags based on thresholds
  const productCards = [
    {
      label: "Total Products",
      value: stats.totalProducts ?? 0,
      icon: "products",
      color: "var(--info)",
      bg: "var(--info-bg)",
      to: "/seller/products",
      sparklinePath: "M0,25 Q20,15 40,20 T80,10 T100,5",
    },
    {
      label: "Approved Products",
      value: stats.approvedProducts ?? 0,
      icon: "approved",
      color: "var(--success)",
      bg: "var(--success-bg)",
      to: "/seller/products",
      sparklinePath: "M0,20 Q20,25 40,15 T80,12 T100,8",
    },
    {
      label: "Pending Approval",
      value: stats.pendingProducts ?? 0,
      icon: "pending",
      color: "var(--warning)",
      bg: "var(--warning-bg)",
      to: "/seller/products",
      sparklinePath: "M0,5 Q20,12 40,8 T80,22 T100,15",
    },
    {
      label: "Low Stock",
      value: stats.lowStockCount ?? 0,
      icon: "low",
      color: "var(--danger)",
      bg: "var(--danger-bg)",
      to: "/seller/products",
      warning: Number(stats.lowStockCount) >= 1,
      sparklinePath: "M0,8 Q20,5 40,10 T80,15 T100,12",
    },
  ];

  const salesCards = [
    {
      label: "Today's Orders",
      value: stats.todayOrders ?? 0,
      icon: "today",
      color: "var(--info)",
      bg: "var(--info-bg)",
      to: "/seller/orders",
      sparklinePath: "M0,15 Q25,8 50,18 T100,12",
    },
    {
      label: "Monthly Orders",
      value: stats.monthlyOrders ?? 0,
      icon: "month",
      color: "var(--info)",
      bg: "var(--info-bg)",
      to: "/seller/orders",
      sparklinePath: "M0,20 Q25,12 50,22 T100,15",
    },
    {
      label: "Total Revenue",
      value: `PKR ${formatPKR(stats.totalRevenue ?? 0)}`,
      icon: "revenue",
      color: "var(--success)",
      bg: "var(--success-bg)",
      highlight: true,
      to: "/seller/orders",
      sparklinePath: "M0,28 Q25,20 50,10 T100,2",
    },
    {
      label: "Fulfilled Orders",
      value: stats.totalFulfilledOrders ?? 0,
      icon: "fulfilled",
      color: "var(--success)",
      bg: "var(--success-bg)",
      to: "/seller/orders",
      sparklinePath: "M0,22 Q25,15 50,12 T100,8",
    },
    {
      label: "Avg Order Value",
      value: `PKR ${formatPKR(stats.averageOrderValue ?? 0)}`,
      icon: "avgOrder",
      color: "var(--info)",
      bg: "var(--info-bg)",
      to: "/seller/orders",
      sparklinePath: "M0,12 Q25,18 50,15 T100,12",
    },
    {
      label: "Pending Shipments",
      value: stats.pendingShipments ?? 0,
      icon: "shipments",
      color: "var(--warning)",
      bg: "var(--warning-bg)",
      to: "/seller/shipments",
      sparklinePath: "M0,5 Q25,12 50,8 T100,15",
    },
    {
      label: "Cancelled Orders",
      value: stats.cancelledOrders ?? 0,
      icon: "cancel",
      color: "var(--danger)",
      bg: "var(--danger-bg)",
      to: "/seller/orders",
      sparklinePath: "M0,5 Q25,8 50,5 T100,4",
    },
    {
      label: "Return Rate",
      value: `${stats.returnRate ?? 0}%`,
      icon: "returnRate",
      color: "var(--danger)",
      bg: "var(--danger-bg)",
      to: "/seller/returns",
      sparklinePath: "M0,15 Q25,12 50,18 T100,12",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviewsCount ?? 0,
      icon: "pendingReviews",
      color: "var(--warning)",
      bg: "var(--warning-bg)",
      to: "/seller/reviews",
      sparklinePath: "M0,8 Q25,12 50,10 T100,8",
    },
    {
      label: "Average Rating",
      value: stats.averageRating ? `${Number(stats.averageRating).toFixed(1)} ★` : "N/A",
      sub: `${stats.totalReviews ?? 0} reviews`,
      icon: "rating",
      color: "var(--warning)",
      bg: "var(--warning-bg)",
      to: "/seller/reviews",
      warning:
        stats.averageRating > 0 &&
        Number(stats.averageRating) < SELLER_LOW_RATING_THRESHOLD,
      sparklinePath: "M0,25 Q25,22 50,24 T100,23",
    },
  ];

  const topSellingProducts = Array.isArray(stats.topSellingProducts) ? stats.topSellingProducts : [];
  const salesTrend = Array.isArray(stats.salesTrend) ? stats.salesTrend : [];
  const maxTrendRevenue = Math.max(0, ...salesTrend.map((d) => Number(d.revenue) || 0));

  const cardStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    transition: "box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
  };

  const hoverStyle = {
    boxShadow: "0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 6px 12px -2px rgba(0, 0, 0, 0.06)",
    transform: "translateY(-3px)",
    borderColor: "var(--primary)",
  };

  const handleCardClick = (to) => navigate(to);

  return (
    <div style={{ padding: "1.5rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>Dashboard</h2>

      {/* Low rating warning banner */}
      {stats.lowRatingStatus && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "12px",
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger-text)",
            fontWeight: 600,
            marginBottom: "1.5rem",
            border: "1px solid var(--danger)",
          }}
        >
          ⚠️ Low Seller Rating Warning — Your average rating is below {SELLER_LOW_RATING_THRESHOLD}.
          {stats.warningCount > 0 && ` Warnings: ${stats.warningCount}/3`}
        </div>
      )}
          <section style={{ marginBottom: "2.5rem" }}>
        <h3 style={sectionHeaderStyle}>Product Overview</h3>
        <div style={gridStyle}>
          {productCards.map((card) => (
            <div
              key={card.label}
              className={`metric-card premium-card ambient-glow-shadow ${card.warning ? "stat-card-warning-red" : ""}`}
              onClick={() => handleCardClick(card.to)}
              style={{ display: "flex", flexDirection: "column", cursor: "pointer", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {card.label}
                </span>
                <span style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: card.bg, color: card.color,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Icon type={card.icon} />
                </span>
              </div>
              <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {card.value}
              </span>

              {/* Sparkline Graph */}
              <svg className="sparkline-svg" viewBox="0 0 100 30" width="100%" height="30" style={{ marginTop: '8px', display: 'block', overflow: 'visible' }}>
                <path
                  d={card.sparklinePath}
                  fill="none"
                  stroke={card.warning ? "var(--danger)" : "var(--primary)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={sectionHeaderStyle}>Sales & Fulfillment</h3>
        <div style={gridStyle}>
          {salesCards.map((card) => (
            <div
              key={card.label}
              className={`metric-card premium-card ambient-glow-shadow ${card.warning ? "stat-card-warning-red" : ""}`}
              onClick={() => handleCardClick(card.to)}
              style={{ display: "flex", flexDirection: "column", cursor: "pointer", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {card.label}
                </span>
                <span style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: card.bg, color: card.color,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Icon type={card.icon} />
                </span>
              </div>
              <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {card.value}
              </span>

              {/* Sparkline Graph */}
              <svg className="sparkline-svg" viewBox="0 0 100 30" width="100%" height="30" style={{ marginTop: '8px', display: 'block', overflow: 'visible' }}>
                <path
                  d={card.sparklinePath}
                  fill="none"
                  stroke={card.warning ? "var(--danger)" : "var(--primary)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              {card.sub && (
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {card.sub}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Top Selling Products */}
      <section style={{ marginTop: "2.5rem" }}>
        <h3 style={sectionHeaderStyle}>Top Selling Products</h3>
        {topSellingProducts.length === 0 ? (
          <EmptyState
            title="No sales yet"
            body="Your best-selling products will appear here once you start making sales."
            style={emptyStateStyle}
          />
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
            {topSellingProducts.map((p, i) => (
              <div
                key={p.productId || i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.9rem 1.25rem",
                  borderBottom: i < topSellingProducts.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 8, background: "var(--info-bg)", color: "var(--info)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </span>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                  {Number(p.quantitySold || 0).toLocaleString()} sold
                </span>
                <span style={{ fontWeight: 600, color: "var(--success)", whiteSpace: "nowrap", minWidth: 90, textAlign: "right" }}>
                  PKR {formatPKR(p.revenue || 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sales Trend — Last 7 Days */}
      <section style={{ marginTop: "2.5rem" }}>
        <h3 style={sectionHeaderStyle}>Sales Trend — Last 7 Days</h3>
        {maxTrendRevenue === 0 ? (
          <EmptyState
            title="No sales yet"
            body="There were no sales in the last 7 days."
            style={emptyStateStyle}
          />
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.5rem 1.25rem 1rem" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "0.5rem" }}>
              {salesTrend.map((d, i) => {
                const rev = Number(d.revenue) || 0;
                const barHeight = maxTrendRevenue > 0 ? Math.round((rev / maxTrendRevenue) * 120) : 0;
                const { weekday, label } = formatTrendDay(d.date);
                return (
                  <div
                    key={d.date || i}
                    title={`${label}: PKR ${formatPKR(rev)} • ${Number(d.orderCount || 0)} order(s)`}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}
                  >
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 600, minHeight: "1rem" }}>
                      {rev > 0 ? formatPKR(rev) : ""}
                    </span>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 40,
                        height: rev > 0 ? Math.max(barHeight, 4) : 2,
                        background: rev > 0 ? "var(--primary)" : "var(--border)",
                        borderRadius: "6px 6px 0 0",
                        transition: "height 0.3s",
                      }}
                    />
                    <span style={{ fontSize: "0.72rem", color: "var(--text-primary)", fontWeight: 600 }}>{weekday}</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const sectionHeaderStyle = {
  fontSize: "1rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "1rem",
  borderBottom: "1px solid var(--border)",
  paddingBottom: "0.5rem",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1rem",
};

const emptyStateStyle = {
  background: "var(--surface)",
  border: "1px dashed var(--border)",
  borderRadius: "16px",
  padding: "2rem",
  textAlign: "center",
  color: "var(--text-secondary)",
  fontSize: "0.9rem",
};

// Parse a 'YYYY-MM-DD' string into local-date parts (avoids UTC day-shift).
const formatTrendDay = (isoDate) => {
  if (!isoDate) return { weekday: "", label: "" };
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return {
    weekday: dt.toLocaleDateString("en-US", { weekday: "short" }),
    label: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`,
  };
};

export default SellerDashboardPage;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

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

  if (loading)
    return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading dashboard...</div>;
  if (!stats)
    return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Could not load stats.</div>;

  const productCards = [
    {
      label: "Total Products",
      value: stats.totalProducts ?? 0,
      icon: "products",
      color: "var(--info)",
      bg: "var(--info-bg)",
      to: "/seller/products",
    },
    {
      label: "Approved Products",
      value: stats.approvedProducts ?? 0,
      icon: "approved",
      color: "var(--success)",
      bg: "var(--success-bg)",
      to: "/seller/products",
    },
    {
      label: "Pending Approval",
      value: stats.pendingProducts ?? 0,
      icon: "pending",
      color: "var(--warning)",
      bg: "var(--warning-bg)",
      to: "/seller/products",
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
    },
    {
      label: "Monthly Orders",
      value: stats.monthlyOrders ?? 0,
      icon: "month",
      color: "var(--info)",
      bg: "var(--info-bg)",
      to: "/seller/orders",
    },
    {
      label: "Total Revenue",
      value: `PKR ${Number(stats.totalRevenue ?? 0).toLocaleString()}`,
      icon: "revenue",
      color: "var(--success)",
      bg: "var(--success-bg)",
      highlight: true,
      to: "/seller/orders",
    },
    {
      label: "Pending Shipments",
      value: stats.pendingShipments ?? 0,
      icon: "shipments",
      color: "var(--warning)",
      bg: "var(--warning-bg)",
      to: "/seller/shipments",
    },
    {
      label: "Cancelled Orders",
      value: stats.cancelledOrders ?? 0,
      icon: "cancel",
      color: "var(--danger)",
      bg: "var(--danger-bg)",
      to: "/seller/orders",
    },
    {
      label: "Average Rating",
      value: stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : "N/A",
      sub: `${stats.totalReviews ?? 0} reviews`,
      icon: "rating",
      color: "var(--warning)",
      bg: "var(--warning-bg)",
      to: "/seller/reviews",
    },
  ];

  const cardStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    transition: "box-shadow 0.2s, transform 0.2s",
    cursor: "pointer",
  };

  const hoverStyle = {
    boxShadow: "0 8px 24px var(--shadow)",
    transform: "translateY(-2px)",
  };

  const handleCardClick = (to) => navigate(to);

  return (
    <div style={{ padding: "1.5rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>Dashboard</h2>

      {/* Product Overview */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h3 style={sectionHeaderStyle}>Product Overview</h3>
        <div style={gridStyle}>
          {productCards.map((card) => (
            <div
              key={card.label}
              style={cardStyle}
              onClick={() => handleCardClick(card.to)}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "none";
              }}
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
            </div>
          ))}
        </div>
      </section>

      {/* Sales & Fulfillment */}
      <section>
        <h3 style={sectionHeaderStyle}>Sales & Fulfillment</h3>
        <div style={gridStyle}>
          {salesCards.map((card) => (
            <div
              key={card.label}
              style={cardStyle}
              onClick={() => handleCardClick(card.to)}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "none";
              }}
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
              <span style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--text-primary)"
              }}>
                {card.value}
              </span>
              {card.sub && (
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {card.sub}
                </span>
              )}
            </div>
          ))}
        </div>
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

export default SellerDashboardPage;
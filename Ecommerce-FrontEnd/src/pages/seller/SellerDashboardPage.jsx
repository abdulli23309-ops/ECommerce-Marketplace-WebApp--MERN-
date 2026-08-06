import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";

const SellerDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get("/seller/dashboard");
        setStats(res.data?.data);
      } catch (err) {
        console.error("Failed to load seller stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return <div style={{ padding: "2rem", color: "#666" }}>Loading dashboard...</div>;
  if (!stats)
    return <div style={{ padding: "2rem", color: "#666" }}>Could not load stats.</div>;

  // --- metric groups ---
  const productCards = [
    { label: "Total Products", value: stats.totalProducts },
    {
      label: "Approved",
      value: stats.approvedProducts ?? 0,
      indicator: "success",
    },
    {
      label: "Pending Approval",
      value: stats.pendingProducts ?? 0,
      indicator: "warn",
    },
    {
      label: "Rejected / Suspended",
      value: stats.rejectedProducts ?? 0,
      indicator: "danger",
    },
  ];

  const orderCards = [
    { label: "Today's Orders", value: stats.todayOrders ?? 0 },
    { label: "Monthly Orders", value: stats.monthlyOrders ?? 0 },
    {
      label: "Revenue",
      value: `PKR ${Number(stats.totalRevenue ?? 0).toLocaleString()}`,
      highlight: true,
    },
    { label: "Pending Shipments", value: stats.pendingShipments ?? 0 },
    {
      label: "Average Rating",
      value: stats.averageRating
        ? `${stats.averageRating.toFixed(1)} ★`
        : "N/A",
      isRating: true,
    },
  ];

  // reusable card style
  const cardStyle = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    transition: "box-shadow 0.2s, border-color 0.2s",
    cursor: "default",
  };

  const hoverStyle = {
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    borderColor: "#d1d5db",
  };

  return (
    <div>
      <h2 className="section-title">Dashboard</h2>

      {/* Product Insights Section */}
      <div style={{ marginBottom: "2rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#374151",
            marginBottom: "0.75rem",
          }}
        >
          Product Insights
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          {productCards.map((card) => (
            <div
              key={card.label}
              style={cardStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, hoverStyle);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, {
                  boxShadow: "none",
                  borderColor: "#e5e7eb",
                });
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {card.label}
              </span>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {card.value}
              </span>
              {card.indicator && (
                <span
                  style={{
                    alignSelf: "flex-start",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    color:
                      card.indicator === "success"
                        ? "#065f46"
                        : card.indicator === "warn"
                        ? "#92400e"
                        : "#991b1b",
                    background:
                      card.indicator === "success"
                        ? "#ecfdf5"
                        : card.indicator === "warn"
                        ? "#fffbeb"
                        : "#fef2f2",
                  }}
                >
                  {card.indicator === "success"
                    ? "● Live"
                    : card.indicator === "warn"
                    ? "▲ Review"
                    : "■ Inactive"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sales & Activity Section */}
      <div>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#374151",
            marginBottom: "0.75rem",
          }}
        >
          Sales & Activity
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          {orderCards.map((card) => (
            <div
              key={card.label}
              style={cardStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, hoverStyle);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, {
                  boxShadow: "none",
                  borderColor: "#e5e7eb",
                });
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {card.label}
              </span>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: card.highlight ? "#059669" : "#111827",
                }}
              >
                {card.value}
              </span>
              {card.isRating && (
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    marginTop: "-0.25rem",
                  }}
                >
                  {stats.totalReviews ?? 0} review{stats.totalReviews !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardPage;
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

// Human‑readable status mapping
const getStatusLabel = (status) => {
  const labels = {
    PENDING_ADMIN_REVIEW: "Under Admin Review",
    REJECTED_BY_ADMIN: "Request Rejected",
    PENDING_SELLER_REVIEW: "Awaiting Seller Review",
    APPROVED_PENDING_SHIPMENT: "Action Required: Ship Item",
    REJECTED_BY_SELLER: "Declined by Seller",
    ITEM_IN_TRANSIT: "Return In Transit",
    SELLER_RECEIVED: "Received by Seller",
    INSPECTED_AND_REFUNDED: "Refund Completed",
  };
  return labels[status] || status;
};

const getStatusStyle = (status) => {
  const styles = {
    PENDING_ADMIN_REVIEW: { backgroundColor: "#fef3c7", color: "#92400e" },
    REJECTED_BY_ADMIN: { backgroundColor: "#fee2e2", color: "#991b1b" },
    PENDING_SELLER_REVIEW: { backgroundColor: "#eff6ff", color: "#1e40af" },
    APPROVED_PENDING_SHIPMENT: { backgroundColor: "#fef3c7", color: "#b45309" },
    REJECTED_BY_SELLER: { backgroundColor: "#fee2e2", color: "#991b1b" },
    ITEM_IN_TRANSIT: { backgroundColor: "#e0e7ff", color: "#3730a3" },
    SELLER_RECEIVED: { backgroundColor: "#f3e8ff", color: "#6b21a8" },
    INSPECTED_AND_REFUNDED: { backgroundColor: "#d1fae5", color: "#065f46" },
  };
  return styles[status] || { backgroundColor: "#f3f4f6", color: "#1f2937" };
};

const ReturnHistoryPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const res = await axiosInstance.get("/returns/mine");
        setReturns(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Failed to load returns", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading returns...</div>;

  if (returns.length === 0) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem", textAlign: "center" }}>
        <h3>No returns yet</h3>
        <p style={{ color: "#666" }}>You haven't requested any returns.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>My Returns</h2>
      {returns.map((ret) => {
        const badgeStyle = getStatusStyle(ret.status);
        const label = getStatusLabel(ret.status);
        return (
          <Link
            to={`/returns/${ret._id}`}
            key={ret._id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              marginBottom: "0.75rem",
              textDecoration: "none",
              color: "#111827",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{ret.productName || ret.product?.name || "Deleted Product"}</div>
              <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Reason: {ret.reason}</div>
              <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                {new Date(ret.createdAt).toLocaleDateString()}
              </div>
            </div>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor: badgeStyle.backgroundColor,
                color: badgeStyle.color,
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default ReturnHistoryPage;
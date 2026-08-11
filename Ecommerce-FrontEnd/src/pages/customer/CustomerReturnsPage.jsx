import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";
import CustomerReturnDetail from "./CustomerReturnDetail";

// Human‑readable status mapping
const getStatusLabel = (status) => {
  const labels = {
    PENDING_ADMIN_REVIEW: "Under Admin Review",
    REJECTED_BY_ADMIN: "Request Rejected",
    PENDING_SELLER_REVIEW: "Awaiting Seller Review",
    APPROVED_PENDING_SHIPMENT: "Action Required: Ship Item",
    REJECTED_BY_SELLER: "Declined by Seller",
    ITEM_IN_TRANSIT: "Return In Transit",
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
    INSPECTED_AND_REFUNDED: { backgroundColor: "#d1fae5", color: "#065f46" },
  };
  return styles[status] || { backgroundColor: "#f3f4f6", color: "#1f2937" };
};

const CustomerReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/returns/mine");
      setReturns(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Failed to load returns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  if (loading)
    return <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading returns...</div>;

  if (returns.length === 0) {
    return (
      <div style={{ padding: "4rem 1rem", textAlign: "center", color: "#6b7280" }}>
        <h3 style={{ fontWeight: 600 }}>No return requests found</h3>
        <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
          Your submitted returns and refund updates will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "850px", margin: "2rem auto", padding: "0 1rem", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>Your Returns</h2>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Track and manage your return requests and refunds
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {returns.map((ret) => {
          const badgeStyle = getStatusStyle(ret.status);
          const label = getStatusLabel(ret.status);
          const productImage = ret.product?.images?.[0];

          return (
            <div
              key={ret._id}
              onClick={() => setSelectedReturn(ret)}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "1.25rem",
                cursor: "pointer",
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                transition: "box-shadow 0.2s, border-color 0.2s",
                position: "relative",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              {/* Product thumbnail */}
              <div style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "#f3f4f6" }}>
                {productImage ? (
                  <img
                    src={getImageUrl(productImage)}
                    alt={ret.product?.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                    <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>
                  Return #{ret.returnNumber || ret._id.slice(-8)}
                </div>
                <div style={{ color: "#4b5563", fontSize: "0.9rem", marginTop: "2px" }}>
                  {ret.product?.name || "Product"} · {ret.reason}
                </div>
                <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "4px" }}>
                  {new Date(ret.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Status badge */}
              <div style={{
                padding: "4px 12px",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                backgroundColor: badgeStyle.backgroundColor,
                color: badgeStyle.color,
                position: "absolute",
                top: "1rem",
                right: "1rem",
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {selectedReturn && (
        <CustomerReturnDetail
          returnReq={selectedReturn}
          onClose={() => setSelectedReturn(null)}
          onUpdate={fetchReturns}
        />
      )}
    </div>
  );
};

export default CustomerReturnsPage;
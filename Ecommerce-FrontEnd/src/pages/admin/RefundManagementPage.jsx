import { useState, useEffect } from "react";
import { getReturns, createRefund } from "../../services/adminService";

const getStatusLabel = (status) => {
  const labels = {
    PENDING_ADMIN_REVIEW: "Under Admin Review",
    REJECTED_BY_ADMIN: "Request Rejected",
    PENDING_SELLER_REVIEW: "Awaiting Seller Review",
    APPROVED_PENDING_SHIPMENT: "Approved – Awaiting Shipment",
    REJECTED_BY_SELLER: "Declined by Seller",
    ITEM_IN_TRANSIT: "In Transit to Seller",
    SELLER_RECEIVED: "Received by Seller",
    INSPECTED_AND_REFUNDED: "Refund Completed",
  };
  return labels[status] || status;
};

const getStatusBadgeStyle = (status) => {
  const base = {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
  };
  switch (status) {
    case "PENDING_ADMIN_REVIEW":
      return { ...base, backgroundColor: "#fef3c7", color: "#92400e" };
    case "PENDING_SELLER_REVIEW":
    case "APPROVED_PENDING_SHIPMENT":
      return { ...base, backgroundColor: "#eff6ff", color: "#1e40af" };
    case "ITEM_IN_TRANSIT":
      return { ...base, backgroundColor: "#e0e7ff", color: "#3730a3" };
    case "SELLER_RECEIVED":
      return { ...base, backgroundColor: "#d1fae5", color: "#065f46" };
    case "INSPECTED_AND_REFUNDED":
      return { ...base, backgroundColor: "#d1fae5", color: "#065f46" };
    case "REJECTED_BY_ADMIN":
    case "REJECTED_BY_SELLER":
      return { ...base, backgroundColor: "#fee2e2", color: "#991b1b" };
    default:
      return { ...base, backgroundColor: "#f3f4f6", color: "#1f2937" };
  }
};

const RefundManagementPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await getReturns();
      // `res` is now an array of return objects (fully populated)
      const allReturns = Array.isArray(res) ? res : res.items || [];
      // Show returns that are ready for refund or are in transit
      const relevantStatuses = [
        "ITEM_IN_TRANSIT",
        "SELLER_RECEIVED",
        "INSPECTED_AND_REFUNDED",
      ];
      const filtered = allReturns.filter((r) =>
        relevantStatuses.includes(r.status)
      );
      setReturns(filtered);
    } catch (err) {
      console.error("Failed to load returns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const handleRefund = async (returnId) => {
    setSubmitting(true);
    setMessage(null);
    try {
      await createRefund(returnId);
      setMessage({ type: "success", text: "Refund processed successfully!" });
      setReturns((prev) => prev.filter((r) => r._id !== returnId));
    } catch (err) {
      setMessage({ type: "error", text: "Failed to process refund." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            Refund Management
          </h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>
            Process refunds for returns that have been received by the seller
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : returns.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
              No returns awaiting refund.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                    Return
                  </th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                    Customer
                  </th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                    Status
                  </th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {returns.map((ret) => {
                  const isRefundEnabled = ret.status === "SELLER_RECEIVED";

                  return (
                    <tr
                      key={ret._id}
                      style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "0.75rem 1.25rem" }}>
                        <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.9rem" }}>
                          {ret.returnNumber || `RET-${ret._id.slice(-8)}`}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "2px" }}>
                          {ret.product?.name || "Product"}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "#4b5563" }}>
                        {ret.customer?.email || "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1.25rem" }}>
                        <span style={getStatusBadgeStyle(ret.status)}>
                          {getStatusLabel(ret.status)}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1.25rem", textAlign: "center" }}>
                        <button
                          onClick={() => handleRefund(ret._id)}
                          disabled={!isRefundEnabled || submitting}
                          title={
                            isRefundEnabled
                              ? "Process refund"
                              : "Waiting for Seller to confirm receipt"
                          }
                          style={{
                            padding: "0.4rem 1rem",
                            borderRadius: "6px",
                            border: "none",
                            background: isRefundEnabled ? "#111827" : "#d1d5db",
                            color: isRefundEnabled ? "#fff" : "#6b7280",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: isRefundEnabled ? "pointer" : "not-allowed",
                            opacity: isRefundEnabled ? 1 : 0.7,
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (isRefundEnabled) e.target.style.background = "#1f2937";
                          }}
                          onMouseLeave={(e) => {
                            if (isRefundEnabled) e.target.style.background = "#111827";
                          }}
                        >
                          {submitting ? "Processing..." : "Refund"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {message && (
            <div
              style={{
                padding: "0.75rem 1.25rem",
                borderTop: "1px solid #f3f4f6",
                color: message.type === "success" ? "#065f46" : "#991b1b",
                fontWeight: 500,
                fontSize: "0.9rem",
              }}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundManagementPage;
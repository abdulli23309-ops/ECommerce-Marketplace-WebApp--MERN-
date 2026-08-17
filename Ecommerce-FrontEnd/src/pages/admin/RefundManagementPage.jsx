import { useState, useEffect } from "react";
import { getReturns, createRefund } from "../../services/adminService";
import { getStatusBadgeStyle } from "../../utils/statusBadge";

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

const RefundManagementPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Backend pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const relevantStatuses = [
    "ITEM_IN_TRANSIT",
    "SELLER_RECEIVED",
    "INSPECTED_AND_REFUNDED",
  ].join(",");

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await getReturns({
        page,
        pageSize: 10,
        statuses: relevantStatuses,
      });

      const items = res.items || (Array.isArray(res) ? res : []);
      setReturns(items);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load returns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, [page]);

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
    <div style={{ backgroundColor: "var(--bg-secondary)", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Refund Management
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Process refunds for returns that have been received by the seller
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            boxShadow: "0 1px 3px var(--shadow)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              Loading...
            </div>
          ) : returns.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              No returns awaiting refund.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    Return
                  </th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    Customer
                  </th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    Status
                  </th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
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
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                    >
                      <td style={{ padding: "0.75rem 1.25rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                          {ret.returnNumber || `RET-${ret._id.slice(-8)}`}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {ret.product?.name || "Product"}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
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
                            background: isRefundEnabled ? "var(--primary)" : "var(--disabled-bg)",
                            color: isRefundEnabled ? "var(--primary-contrast)" : "var(--disabled-text)",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: isRefundEnabled ? "pointer" : "not-allowed",
                            opacity: isRefundEnabled ? 1 : 0.7,
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (isRefundEnabled) e.currentTarget.style.background = "var(--primary-hover)";
                          }}
                          onMouseLeave={(e) => {
                            if (isRefundEnabled) e.currentTarget.style.background = "var(--primary)";
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
                borderTop: "1px solid var(--border)",
                color: message.type === "success" ? "var(--success-text)" : "var(--danger-text)",
                fontWeight: 500,
                fontSize: "0.9rem",
              }}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Pagination */}
        {returns.length > 0 && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundManagementPage;
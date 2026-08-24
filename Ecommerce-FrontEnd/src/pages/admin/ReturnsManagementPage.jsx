import { useState, useEffect } from "react";
import { getReturns } from "../../services/adminService";
import { getImageUrl } from "../../utils/imageHelper";
import axiosInstance from "../../services/axiosInstance";
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

const ReturnsManagementPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedReturn, setSelectedReturn] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await getReturns({ page, pageSize: 10 });
      const items = res.items || (Array.isArray(res) ? res : []);
      setReturns(items);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, [page]);

  const handleAction = async (returnId, action) => {
    try {
      await axiosInstance.put(`/returns/${returnId}/admin-decision`, {
        decision: action === "approve" ? "APPROVE" : "REJECT",
        adminNotes: adminNotes.trim() || undefined,
      });

      setReturns((prev) =>
        prev.map((r) =>
          r._id === returnId
            ? {
                ...r,
                status:
                  action === "approve"
                    ? "PENDING_SELLER_REVIEW"
                    : "REJECTED_BY_ADMIN",
              }
            : r
        )
      );
      setSelectedReturn(null);
      setAdminNotes("");
    } catch (err) {
      console.error(`Failed to ${action} return`, err);
      alert(err.response?.data?.message || "Could not process request.");
    }
  };

  const pendingCount = returns.filter(r => r.status === "PENDING_ADMIN_REVIEW").length;

  if (loading) return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <div className="skeleton" style={{ height: "40px", width: "250px", margin: "0 auto 2rem" }}></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton-card" style={{ marginBottom: "1rem", padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: "24px", marginBottom: "0.5rem" }}></div>
          <div className="skeleton" style={{ height: "20px", width: "70%" }}></div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
            🔄 Returns Management
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>
            Review and process customer return requests
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="notification-badge" style={{ fontSize: "0.85rem", padding: "4px 12px" }}>
            {pendingCount} Pending
          </div>
        )}
      </div>

      {returns.length === 0 ? (
        <div className="empty-state-modern">
          <div className="empty-state-icon">
            <svg width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>No Return Requests</h3>
          <p>All return requests are processed.</p>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "0 1px 3px var(--shadow)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Customer
                </th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Product
                </th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Reason
                </th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Tracking
                </th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Status
                </th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {returns.map((ret) => (
                <tr
                  key={ret._id}
                  style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s", cursor: "pointer" }}
                  onClick={() => setSelectedReturn(ret)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                >
                  <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    {ret.customer?.email || "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", fontWeight: 500, color: "var(--text-primary)" }}>
                    {ret.product?.name}
                  </td>
                  <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ret.reason}
                  </td>
                  <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontFamily: "monospace", wordWrap: "break-word", wordBreak: "break-all", maxWidth: "150px" }}>
                    {ret.returnTrackingNumber || "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1.25rem" }}>
                    <span style={getStatusBadgeStyle(ret.status)}>
                      {getStatusLabel(ret.status)}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1.25rem", textAlign: "center" }}>
                    {ret.status === "PENDING_ADMIN_REVIEW" ? (
                      <span className="notification-badge" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>
                        Review
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {returns.length > 0 && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem", alignItems: "center" }}>
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: page <= 1 ? "var(--disabled-bg)" : "var(--surface)",
              color: page <= 1 ? "var(--disabled-text)" : "var(--text-primary)",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: page >= totalPages ? "var(--disabled-bg)" : "var(--surface)",
              color: page >= totalPages ? "var(--disabled-text)" : "var(--text-primary)",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Luxury Detail Drawer */}
      {selectedReturn && (
        <>
          <div className="returns-drawer-overlay" onClick={() => setSelectedReturn(null)} />
          <div className="returns-drawer">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Return #{selectedReturn.returnNumber || selectedReturn._id.slice(-8).toUpperCase()}
              </h3>
              <button onClick={() => setSelectedReturn(null)} className="returns-close-btn">
                ×
              </button>
            </div>

            {/* Product Info */}
            <div className="returns-product-preview" style={{ marginBottom: "1.5rem" }}>
              <div className="returns-product-image" style={{ width: "64px", height: "64px" }}>
                {selectedReturn.product?.images?.[0] ? (
                  <img src={getImageUrl(selectedReturn.product.images[0])} alt={selectedReturn.product.name} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                  {selectedReturn.product?.name}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Customer: {selectedReturn.customer?.name || selectedReturn.customer?.email}
                </div>
              </div>
            </div>

            {/* Return Details */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div className="returns-info-row">
                <span className="returns-info-label">Status</span>
                <span style={getStatusBadgeStyle(selectedReturn.status)}>
                  {getStatusLabel(selectedReturn.status)}
                </span>
              </div>
              <div className="returns-info-row">
                <span className="returns-info-label">Reason</span>
                <span className="returns-info-value">{selectedReturn.reason}</span>
              </div>
              {selectedReturn.description && (
                <div className="returns-info-row">
                  <span className="returns-info-label">Description</span>
                  <span className="returns-info-value">{selectedReturn.description}</span>
                </div>
              )}
              {selectedReturn.returnTrackingNumber && (
                <div className="returns-info-row">
                  <span className="returns-info-label">Tracking</span>
                  <span className="returns-info-value" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                    {selectedReturn.returnTrackingNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Evidence Images */}
            {selectedReturn.images?.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 className="returns-section-title">📷 Evidence</h4>
                <div className="returns-evidence-gallery">
                  {selectedReturn.images.map((img, i) => (
                    <img
                      key={i}
                      src={getImageUrl(img)}
                      alt={`Evidence ${i+1}`}
                      className="returns-evidence-image"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Action: Admin Decision */}
            {selectedReturn.status === "PENDING_ADMIN_REVIEW" && (
              <div className="returns-alert returns-alert-warning" style={{ marginBottom: "1.5rem" }}>
                <div className="returns-alert-icon">⚠️</div>
                <div className="returns-alert-content">
                  <h4>Admin Review Required</h4>
                  <p>Review the return request and make a decision. Approval will forward to the seller for final review.</p>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Optional: Add admin notes..."
                    rows={3}
                    className="returns-textarea"
                    style={{ marginTop: "1rem", marginBottom: "1rem" }}
                  />
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => handleAction(selectedReturn._id, "approve")}
                      className="returns-btn-approve"
                      style={{ flex: 1 }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleAction(selectedReturn._id, "reject")}
                      className="returns-btn-reject"
                      style={{ flex: 1 }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button onClick={() => setSelectedReturn(null)} className="returns-btn-secondary" style={{ width: "100%" }}>
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReturnsManagementPage;

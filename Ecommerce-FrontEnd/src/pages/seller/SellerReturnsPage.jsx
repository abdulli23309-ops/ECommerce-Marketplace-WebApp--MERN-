import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";
import { getStatusBadgeStyle } from "../../utils/statusBadge";
import { toastError } from "../../components/common/Toast";

const getStatusLabel = (status) => {
  const labels = {
    PENDING_ADMIN_REVIEW: "Under Admin Review",
    REJECTED_BY_ADMIN: "Request Rejected",
    PENDING_SELLER_REVIEW: "Awaiting Your Review",
    APPROVED_PENDING_SHIPMENT: "Approved – Awaiting Shipment",
    REJECTED_BY_SELLER: "Declined by You",
    ITEM_IN_TRANSIT: "In Transit – Awaiting Receipt",
    SELLER_RECEIVED: "Received & Inspected",
    INSPECTED_AND_REFUNDED: "Refund Completed",
  };
  return labels[status] || status;
};

const SellerReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [notes, setNotes] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(returns.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReturns = returns.slice(startIndex, startIndex + itemsPerPage);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/returns/seller");
      setReturns(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [returns.length, currentPage, totalPages]);

  const handleDecision = async (decision) => {
    if (!selectedReturn) return;

    try {
      if (decision === "CONFIRM_RECEIPT") {
        await axiosInstance.put(`/returns/${selectedReturn._id}/seller-decision`, {
          decision: "CONFIRM_RECEIPT",
          sellerNotes: notes,
        });
      } else {
        await axiosInstance.put(`/returns/${selectedReturn._id}/seller-decision`, {
          decision,
          sellerNotes: notes,
        });
      }
      setSelectedReturn(null);
      setNotes("");
      load();
    } catch (err) {
      console.error("Failed to process decision", err);
      toastError(err.response?.data?.message || "Could not process request.");
    }
  };

  if (loading) return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <div className="skeleton" style={{ height: "40px", width: "200px", margin: "0 auto 2rem" }}></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton-card" style={{ marginBottom: "1rem", padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: "24px", marginBottom: "0.5rem" }}></div>
          <div className="skeleton" style={{ height: "20px", width: "60%" }}></div>
        </div>
      ))}
    </div>
  );

  const getReturnId = (ret) =>
    ret.returnNumber ? ret.returnNumber : `RET-${ret._id.slice(-8).toUpperCase()}`;

  const pendingCount = returns.filter(r => r.status === "PENDING_SELLER_REVIEW" || r.status === "ITEM_IN_TRANSIT").length;

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
            📦 Return Requests
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>
            Manage customer return requests and process refunds
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
          <p>You don't have any return requests at the moment.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {currentReturns.map((ret) => (
            <div key={ret._id} className="returns-card" onClick={() => setSelectedReturn(ret)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                    {getReturnId(ret)}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    {ret.product?.name} • {ret.customer?.name || ret.customer?.email}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    {ret.reason}
                  </div>
                </div>
                <span style={getStatusBadgeStyle(ret.status)}>
                  {getStatusLabel(ret.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {returns.length > itemsPerPage && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem", alignItems: "center" }}>
          <button
            className="page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: currentPage <= 1 ? "var(--disabled-bg)" : "var(--surface)",
              color: currentPage <= 1 ? "var(--disabled-text)" : "var(--text-primary)",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: currentPage >= totalPages ? "var(--disabled-bg)" : "var(--surface)",
              color: currentPage >= totalPages ? "var(--disabled-text)" : "var(--text-primary)",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Luxury Decision Drawer */}
      {selectedReturn && (
        <>
          <div className="returns-drawer-overlay" onClick={() => setSelectedReturn(null)} />
          <div className="returns-drawer">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {getReturnId(selectedReturn)}
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
              {selectedReturn.adminNotes && (
                <div className="returns-info-row">
                  <span className="returns-info-label">Admin Notes</span>
                  <span className="returns-info-value">{selectedReturn.adminNotes}</span>
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

            {/* Action: Confirm Receipt */}
            {selectedReturn.status === "ITEM_IN_TRANSIT" && (
              <div className="returns-alert returns-alert-info" style={{ marginBottom: "1.5rem" }}>
                <div className="returns-alert-icon">📦</div>
                <div className="returns-alert-content">
                  <h4>Confirm Receipt & Approve Refund</h4>
                  <p>Once you receive and inspect the item, confirm receipt to process the refund.</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional: Add inspection notes..."
                    rows={3}
                    className="returns-textarea"
                    style={{ marginTop: "1rem", marginBottom: "0.75rem" }}
                  />
                  <button
                    onClick={() => handleDecision("CONFIRM_RECEIPT")}
                    className="returns-btn-approve"
                    style={{ width: "100%" }}
                  >
                    ✓ Confirm Receipt & Approve Refund
                  </button>
                </div>
              </div>
            )}

            {/* Action: Approve/Reject */}
            {selectedReturn.status === "PENDING_SELLER_REVIEW" && (
              <div className="returns-alert returns-alert-warning" style={{ marginBottom: "1.5rem" }}>
                <div className="returns-alert-icon">⚠️</div>
                <div className="returns-alert-content">
                  <h4>Review Required</h4>
                  <p>Please review this return request and make a decision.</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional: Add your notes..."
                    rows={3}
                    className="returns-textarea"
                    style={{ marginTop: "1rem", marginBottom: "1rem" }}
                  />
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => handleDecision("APPROVE")}
                      className="returns-btn-approve"
                      style={{ flex: 1 }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleDecision("REJECT")}
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

export default SellerReturnsPage;

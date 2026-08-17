import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";
import { getStatusBadgeStyle } from "../../utils/statusBadge";

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

  // Frontend-only pagination
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
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  const getReturnId = (ret) =>
    ret.returnNumber ? ret.returnNumber : `RET-${ret._id.slice(-8).toUpperCase()}`;

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Return Requests
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {currentReturns.map((ret) => (
          <div
            key={ret._id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "1rem",
              cursor: "pointer",
            }}
            onClick={() => setSelectedReturn(ret)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{getReturnId(ret)}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  {ret.product?.name} – {ret.customer?.name}
                </div>
              </div>
              <span style={getStatusBadgeStyle(ret.status)}>
                {getStatusLabel(ret.status)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {returns.length > itemsPerPage && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
          <button
            className="page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      )}

      {/* Decision drawer */}
      {selectedReturn && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 999,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "400px",
              background: "var(--surface)",
              height: "100vh",
              padding: "2rem",
              overflowY: "auto",
            }}
          >
            <button
              onClick={() => setSelectedReturn(null)}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <h3>{getReturnId(selectedReturn)}</h3>
            <p><strong>Reason:</strong> {selectedReturn.reason}</p>
            <p><strong>Description:</strong> {selectedReturn.description}</p>

            {selectedReturn.images?.length > 0 &&
              selectedReturn.images.map((img, i) => (
                <img
                  key={i}
                  src={getImageUrl(img)}
                  alt="evidence"
                  style={{ width: "100px", margin: "0.25rem" }}
                />
              ))}

            {selectedReturn.returnTrackingNumber && (
              <p style={{ marginTop: "1rem" }}>
                <strong>Tracking Number:</strong> {selectedReturn.returnTrackingNumber}
              </p>
            )}

            {selectedReturn.adminNotes && (
              <p><strong>Admin Notes:</strong> {selectedReturn.adminNotes}</p>
            )}

            {selectedReturn.status === "ITEM_IN_TRANSIT" && (
              <div style={{ marginTop: "1rem" }}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Inspection notes…"
                  rows={3}
                  style={{ width: "100%", marginBottom: "1rem" }}
                />
                <button
                  onClick={() => handleDecision("CONFIRM_RECEIPT")}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#059669",
                    color: "var(--primary-contrast)",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    width: "100%",
                  }}
                >
                  Confirm Receipt & Approve Refund
                </button>
              </div>
            )}

            {selectedReturn.status === "PENDING_SELLER_REVIEW" && (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Your notes…"
                  rows={3}
                  style={{ width: "100%", marginTop: "1rem" }}
                />
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    onClick={() => handleDecision("APPROVE")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "var(--success)",
                      color: "var(--primary-contrast)",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision("REJECT")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "var(--danger)",
                      color: "var(--primary-contrast)",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerReturnsPage;
import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";

// Human‑readable status mapping
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

const getStatusBadgeStyle = (status) => {
  const base = {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    display: "inline-block",
  };
  switch (status) {
    case "PENDING_ADMIN_REVIEW":
    case "PENDING_SELLER_REVIEW":
      return { ...base, backgroundColor: "#eff6ff", color: "#1e40af" };
    case "APPROVED_PENDING_SHIPMENT":
      return { ...base, backgroundColor: "#fef3c7", color: "#b45309" };
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

const SellerReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [notes, setNotes] = useState("");

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

  const handleDecision = async (decision) => {
    if (!selectedReturn) return;

    if (decision === "CONFIRM_RECEIPT") {
      // Seller confirms receipt → status becomes SELLER_RECEIVED, admin can now refund
      await axiosInstance.put(`/returns/${selectedReturn._id}/seller-decision`, {
        decision: "CONFIRM_RECEIPT",
        sellerNotes: notes,
      });
    } else {
      // standard approve / reject for PENDING_SELLER_REVIEW
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
        {returns.map((ret) => (
          <div
            key={ret._id}
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "1rem",
              cursor: "pointer",
            }}
            onClick={() => setSelectedReturn(ret)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{getReturnId(ret)}</div>
                <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
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
              background: "#fff",
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

            {/* Tracking number (if available) */}
            {selectedReturn.returnTrackingNumber && (
              <p style={{ marginTop: "1rem" }}>
                <strong>Tracking Number:</strong> {selectedReturn.returnTrackingNumber}
              </p>
            )}

            {selectedReturn.adminNotes && (
              <p><strong>Admin Notes:</strong> {selectedReturn.adminNotes}</p>
            )}

            {/* --- Action: Confirm Receipt (for ITEM_IN_TRANSIT) --- */}
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
                    color: "#fff",
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

            {/* --- Action: Approve/Reject (for PENDING_SELLER_REVIEW) --- */}
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
                      background: "#10b981",
                      color: "#fff",
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
                      background: "#ef4444",
                      color: "#fff",
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
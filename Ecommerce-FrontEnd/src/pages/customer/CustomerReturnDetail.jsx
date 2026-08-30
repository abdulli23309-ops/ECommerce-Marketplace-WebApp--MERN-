import { useState, useEffect } from "react";
import { getImageUrl } from "../../utils/imageHelper";
import axiosInstance from "../../services/axiosInstance";
import { toastError } from "../../components/common/Toast";

const CustomerReturnDetail = ({ returnReq, onClose, onUpdate }) => {
  const [tracking, setTracking] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refundAmount, setRefundAmount] = useState(null);

  useEffect(() => {
    if (returnReq.status === "INSPECTED_AND_REFUNDED") {
      axiosInstance.get(`/returns/${returnReq._id}/refund`)
        .then(res => { const refund = res.data?.data || res.data; if (refund?.amount) setRefundAmount(refund.amount); })
        .catch(console.error);
    }
  }, [returnReq]);

  const handleShip = async () => {
    if (!tracking.trim()) return;
    setSubmitting(true);
    try {
      await axiosInstance.put(`/returns/${returnReq._id}/tracking`, { trackingNumber: tracking });
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Failed to update tracking", err);
      toastError("Could not update tracking.");
    } finally {
      setSubmitting(false);
    }
  };

  // Premium Vertical Timeline matching OrderDetailPage architecture
  const getTimelineEvents = () => {
    const events = [];

    // Event 1: Request Submitted (always completed)
    events.push({
      status: "Request Submitted",
      timestamp: returnReq.createdAt,
      note: "Your return request has been received",
      isCurrent: returnReq.status === "PENDING_ADMIN_REVIEW",
      isCompleted: true,
    });

    // Event 2: Admin Decision
    if (returnReq.status === "REJECTED_BY_ADMIN") {
      events.push({
        status: "Request Rejected",
        timestamp: returnReq.updatedAt,
        note: returnReq.adminNotes || "Your return was not approved by admin",
        isCurrent: false,
        isCompleted: true,
        isFailed: true,
      });
    } else if (["PENDING_SELLER_REVIEW", "APPROVED_PENDING_SHIPMENT", "ITEM_IN_TRANSIT", "SELLER_RECEIVED", "INSPECTED_AND_REFUNDED"].includes(returnReq.status)) {
      events.push({
        status: "Admin Approved",
        timestamp: returnReq.updatedAt,
        note: returnReq.adminNotes || "Admin has reviewed and approved your request",
        isCurrent: returnReq.status === "PENDING_SELLER_REVIEW",
        isCompleted: true,
      });
    }

    // Event 3: Seller Decision
    if (returnReq.status === "REJECTED_BY_SELLER") {
      events.push({
        status: "Seller Declined",
        timestamp: returnReq.updatedAt,
        note: returnReq.sellerNotes || "Seller has declined the return",
        isCurrent: false,
        isCompleted: true,
        isFailed: true,
      });
    } else if (["ITEM_IN_TRANSIT", "SELLER_RECEIVED", "INSPECTED_AND_REFUNDED"].includes(returnReq.status)) {
      events.push({
        status: "Seller Approved",
        timestamp: returnReq.updatedAt,
        note: returnReq.sellerNotes || "Seller has approved the return",
        isCurrent: false,
        isCompleted: true,
      });
    }

    // Event 4: Item Shipped
    if (returnReq.returnTrackingNumber && ["ITEM_IN_TRANSIT", "SELLER_RECEIVED", "INSPECTED_AND_REFUNDED"].includes(returnReq.status)) {
      events.push({
        status: "Item Shipped",
        timestamp: returnReq.updatedAt,
        note: `Tracking: ${returnReq.returnTrackingNumber}`,
        isCurrent: returnReq.status === "ITEM_IN_TRANSIT",
        isCompleted: true,
      });
    }

    // Event 5: Seller Received
    if (["SELLER_RECEIVED", "INSPECTED_AND_REFUNDED"].includes(returnReq.status)) {
      events.push({
        status: "Received by Seller",
        timestamp: returnReq.updatedAt,
        note: "Seller has received and is inspecting the item",
        isCurrent: returnReq.status === "SELLER_RECEIVED",
        isCompleted: true,
      });
    }

    // Event 6: Refund Completed
    if (returnReq.status === "INSPECTED_AND_REFUNDED") {
      events.push({
        status: "Refund Completed",
        timestamp: returnReq.updatedAt,
        note: refundAmount ? `PKR ${refundAmount.toLocaleString()} refunded to your account` : "Refund has been processed",
        isCurrent: true,
        isCompleted: true,
      });
    }

    return events;
  };

  const timelineEvents = getTimelineEvents();

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="returns-modal-overlay" onClick={onClose}>
        <div
          className="returns-modal-content"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="returns-modal-header">
          <h3 className="returns-modal-title">
            Return #{returnReq.returnNumber || returnReq._id.slice(-8).toUpperCase()}
          </h3>
          <button onClick={onClose} className="returns-close-btn">×</button>
        </div>

        {/* Product Preview */}
        <div className="returns-product-preview">
          <div className="returns-product-image">
            {returnReq.product?.images?.[0] ? (
              <img src={getImageUrl(returnReq.product.images[0])} alt={returnReq.product.name} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
              {returnReq.product?.name || "Product"}
            </div>
            <div className="returns-info-row" style={{ padding: "0.25rem 0", borderBottom: "none" }}>
              <span className="returns-info-label">Reason:</span>
              <span className="returns-info-value" style={{ maxWidth: "70%" }}>{returnReq.reason}</span>
            </div>
            {returnReq.description && (
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: 1.5 }}>
                {returnReq.description}
              </div>
            )}
          </div>
        </div>

        {/* Evidence Photos */}
        {returnReq.images?.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 className="returns-section-title">📷 Evidence Photos</h4>
            <div className="returns-evidence-gallery">
              {returnReq.images.map((img, i) => (
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

        {/* Premium Vertical Timeline */}
        {timelineEvents.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 className="returns-section-title">📍 Tracking History</h4>
            <ol className="vv-timeline">
              {timelineEvents.map((event, idx) => (
                <li
                  key={idx}
                  className={`vv-timeline__item${event.isCurrent ? " vv-timeline__item--current" : ""}${event.isFailed ? " vv-timeline__item--failed" : ""}`}
                >
                  <span className="vv-timeline__dot" />
                  <div className="vv-timeline__status">{event.status}</div>
                  {event.timestamp && (
                    <div className="vv-timeline__time">{formatTimestamp(event.timestamp)}</div>
                  )}
                  {event.note && (
                    <div className="vv-timeline__note" style={{ wordBreak: "break-all" }}>{event.note}</div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Action Required: Ship Item */}
        {returnReq.status === "APPROVED_PENDING_SHIPMENT" && (
          <div className="returns-alert returns-alert-warning">
            <div className="returns-alert-icon">📦</div>
            <div className="returns-alert-content">
              <h4>Action Required: Ship the Item</h4>
              <p>Please pack the item securely and ship it to the seller. Once shipped, enter the tracking number below.</p>
              <input
                type="text"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Enter Tracking ID (e.g., TRK123456789)"
                className="returns-input"
                style={{ marginTop: "1rem", marginBottom: "0.75rem" }}
              />
              <button
                onClick={handleShip}
                disabled={submitting || !tracking.trim()}
                className="returns-btn-primary"
                style={{ width: "100%" }}
              >
                {submitting ? "Submitting..." : "✓ Submit Tracking Info"}
              </button>
            </div>
          </div>
        )}

        {/* Success: Refund Completed */}
        {returnReq.status === "INSPECTED_AND_REFUNDED" && (
          <div className="returns-alert returns-alert-success">
            <div className="returns-alert-icon">🎉</div>
            <div className="returns-alert-content">
              <h4>Refund Completed!</h4>
              <p>The amount has been sent back to your original payment method. Please allow 5-7 business days for the refund to appear.</p>
            </div>
          </div>
        )}

        <button onClick={onClose} className="returns-btn-secondary" style={{ width: "100%" }}>
          Close
        </button>
      </div>
      </div>
    </>
  );
};

export default CustomerReturnDetail;

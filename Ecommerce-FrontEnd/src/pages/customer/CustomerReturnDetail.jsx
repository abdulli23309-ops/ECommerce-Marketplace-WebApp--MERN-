import { useState, useEffect, useRef } from "react";
import { getImageUrl } from "../../utils/imageHelper";
import axiosInstance from "../../services/axiosInstance";
import { toastError, toastSuccess } from "../../components/common/Toast";

const CustomerReturnDetail = ({ returnReq, onClose, onUpdate }) => {
  const [tracking, setTracking] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refundAmount, setRefundAmount] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [returnReq._id]);

  useEffect(() => {
    if (returnReq.status === "INSPECTED_AND_REFUNDED") {
      axiosInstance
        .get(`/returns/${returnReq._id}/refund`)
        .then((res) => {
          const refund = res.data?.data || res.data;
          if (refund?.amount) setRefundAmount(refund.amount);
        })
        .catch(console.error);
    }
  }, [returnReq]);

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleShip = async () => {
    if (!tracking.trim()) return;
    setSubmitting(true);
    try {
      await axiosInstance.put(`/returns/${returnReq._id}/tracking`, {
        trackingNumber: tracking.trim(),
      });
      toastSuccess("Tracking number submitted successfully!");
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Failed to update tracking", err);
      toastError("Could not update tracking information. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Vertical Timeline Data
  const getTimelineEvents = () => {
    const events = [];

    // Event 1: Request Submitted (always completed)
    events.push({
      status: "Request Submitted",
      timestamp: returnReq.createdAt,
      note: "Your return request has been submitted and is queued for review.",
      isCurrent: returnReq.status === "PENDING_ADMIN_REVIEW",
      isCompleted: true,
    });

    // Event 2: Admin Decision
    if (returnReq.status === "REJECTED_BY_ADMIN") {
      events.push({
        status: "Request Rejected by Admin",
        timestamp: returnReq.updatedAt,
        note: returnReq.adminNotes || "Your return was not approved by administration.",
        isCurrent: true,
        isCompleted: true,
        isFailed: true,
      });
    } else if (
      [
        "PENDING_SELLER_REVIEW",
        "APPROVED_PENDING_SHIPMENT",
        "ITEM_IN_TRANSIT",
        "SELLER_RECEIVED",
        "INSPECTED_AND_REFUNDED",
      ].includes(returnReq.status)
    ) {
      events.push({
        status: "Admin Approved",
        timestamp: returnReq.updatedAt,
        note: returnReq.adminNotes || "Admin has reviewed and verified your request.",
        isCurrent: returnReq.status === "PENDING_SELLER_REVIEW",
        isCompleted: true,
      });
    }

    // Event 3: Seller Decision
    if (returnReq.status === "REJECTED_BY_SELLER") {
      events.push({
        status: "Declined by Seller",
        timestamp: returnReq.updatedAt,
        note: returnReq.sellerNotes || "Seller has declined the return request.",
        isCurrent: true,
        isCompleted: true,
        isFailed: true,
      });
    } else if (
      ["APPROVED_PENDING_SHIPMENT", "ITEM_IN_TRANSIT", "SELLER_RECEIVED", "INSPECTED_AND_REFUNDED"].includes(
        returnReq.status
      )
    ) {
      events.push({
        status: "Seller Approved",
        timestamp: returnReq.updatedAt,
        note: returnReq.sellerNotes || "Seller has accepted the return request.",
        isCurrent: returnReq.status === "APPROVED_PENDING_SHIPMENT",
        isCompleted: true,
      });
    }

    // Event 4: Item Shipped / In Transit
    if (
      returnReq.returnTrackingNumber ||
      ["ITEM_IN_TRANSIT", "SELLER_RECEIVED", "INSPECTED_AND_REFUNDED"].includes(returnReq.status)
    ) {
      events.push({
        status: "Item Shipped",
        timestamp: returnReq.updatedAt,
        note: returnReq.returnTrackingNumber
          ? `Tracking Number: ${returnReq.returnTrackingNumber}`
          : "Package has been dispatched.",
        isCurrent: returnReq.status === "ITEM_IN_TRANSIT",
        isCompleted: true,
      });
    }

    // Event 5: Seller Received
    if (["SELLER_RECEIVED", "INSPECTED_AND_REFUNDED"].includes(returnReq.status)) {
      events.push({
        status: "Received by Seller",
        timestamp: returnReq.updatedAt,
        note: "Seller has received the item and is conducting quality inspection.",
        isCurrent: returnReq.status === "SELLER_RECEIVED",
        isCompleted: true,
      });
    }

    // Event 6: Refund Completed
    if (returnReq.status === "INSPECTED_AND_REFUNDED") {
      events.push({
        status: "Refund Completed",
        timestamp: returnReq.updatedAt,
        note: refundAmount
          ? `PKR ${refundAmount.toLocaleString()} refunded to your payment method.`
          : "Refund transaction has been finalized.",
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
    <div className="returns-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="returns-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- 1. Modal Header --- */}
        <div className="returns-modal-header">
          <div className="returns-modal-header-left">
            <span className="returns-modal-badge">Return Details</span>
            <h3 className="returns-modal-title">
              #{returnReq.returnNumber || returnReq._id.slice(-8).toUpperCase()}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="returns-close-btn"
            aria-label="Close modal"
            title="Close (Esc)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* --- 2. Modal Body --- */}
        <div className="return-modal-body" ref={scrollRef}>
          {/* Product Return Summary Card */}
          <div className="return-product-card">
            <div className="return-product-thumb">
              {returnReq.product?.images?.[0] ? (
                <img
                  src={getImageUrl(returnReq.product.images[0])}
                  alt={returnReq.product?.name || "Product"}
                />
              ) : (
                <div className="return-product-placeholder">
                  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="return-product-meta">
              <h4 className="return-product-title">
                {returnReq.product?.name || "Product"}
              </h4>
              <div className="return-product-reason-row">
                <span className="return-reason-tag">Reason</span>
                <span className="return-reason-text">{returnReq.reason}</span>
              </div>
              {returnReq.description && (
                <div className="return-customer-comment">
                  <span className="comment-quote-icon">“</span>
                  <p className="comment-text">{returnReq.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Evidence Photos Gallery */}
          {returnReq.images?.length > 0 && (
            <div className="return-section">
              <h5 className="return-section-title">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Evidence Photos ({returnReq.images.length})
              </h5>
              <div className="returns-evidence-gallery">
                {returnReq.images.map((img, i) => (
                  <a
                    key={i}
                    href={getImageUrl(img)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="returns-evidence-item"
                    title={`View evidence photo ${i + 1}`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Evidence ${i + 1}`}
                      className="returns-evidence-image"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tracking History Timeline */}
          {timelineEvents.length > 0 && (
            <div className="return-section">
              <h5 className="return-section-title">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tracking History
              </h5>
              <ol className="timeline-tracker">
                {timelineEvents.map((event, idx) => {
                  const isCompleted = event.isCompleted;
                  const isActive = event.isCurrent && !event.isFailed;
                  const isFailed = event.isFailed;
                  return (
                    <li
                      key={idx}
                      className={`timeline-step ${isCompleted ? "completed" : ""} ${
                        isActive ? "active" : ""
                      } ${isFailed ? "failed" : ""}`}
                    >
                      <div className="step-indicator">
                        {isFailed ? (
                          <span className="step-indicator-icon step-failed">✕</span>
                        ) : isCompleted ? (
                          <svg className="step-checkmark" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <span className={`step-pulse-dot ${isActive ? "active" : ""}`} />
                        )}
                      </div>
                      <div className="step-content">
                        <div className="step-header-line">
                          <span
                            className={`step-status ${isCompleted ? "completed" : ""} ${
                              isActive ? "active" : ""
                            } ${isFailed ? "failed" : ""}`}
                          >
                            {event.status}
                          </span>
                          {event.timestamp && (
                            <span className="step-time">{formatTimestamp(event.timestamp)}</span>
                          )}
                        </div>
                        {event.note && <div className="step-note">{event.note}</div>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Action Required: Ship Item */}
          {returnReq.status === "APPROVED_PENDING_SHIPMENT" && (
            <div className="return-alert return-alert-warning">
              <div className="return-alert-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="return-alert-content">
                <h5 className="return-alert-title">Action Required: Ship the Item</h5>
                <p className="return-alert-message">
                  Please pack the item securely and ship it to the seller. Once dispatched, enter the courier tracking ID below.
                </p>
                <div className="return-ship-form">
                  <input
                    type="text"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Enter Tracking ID (e.g., TCS-98234123)"
                    className="return-input"
                  />
                  <button
                    onClick={handleShip}
                    disabled={submitting || !tracking.trim()}
                    className="return-btn-primary"
                  >
                    {submitting ? "Submitting..." : "Submit Tracking Info"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success: Refund Completed Banner */}
          {returnReq.status === "INSPECTED_AND_REFUNDED" && (
            <div className="return-status-banner return-status-success">
              <div className="return-status-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="return-status-content">
                <h5 className="return-status-title">Refund Completed Successfully!</h5>
                <p className="return-status-message">
                  {refundAmount
                    ? `PKR ${refundAmount.toLocaleString()} has been sent to your original payment method.`
                    : "The refund amount has been refunded to your original payment method."}{" "}
                  Please allow 3–5 business days for bank processing.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* --- 3. Modal Footer --- */}
        <div className="return-modal-footer">
          <button onClick={onClose} className="return-btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerReturnDetail;

import React from "react";

/**
 * Unified status chip (UI-01). Replaces the two ad-hoc badge utilities
 * (utils/statusBadge.js inline styles and the ad-hoc rgba status spans) with a
 * single theme-aware component. All colours resolve through design tokens.
 */
export const STATUS_TONES = {
  // success
  Approved: "success",
  Active: "success",
  Delivered: "success",
  Completed: "success",
  Refunded: "success",
  INSPECTED_AND_REFUNDED: "success",
  Paid: "success",
  "Paid on Delivery": "success",
  // warning
  Pending: "warning",
  Processing: "warning",
  "Approved Pending Shipment": "warning",
  APPROVED_PENDING_SHIPMENT: "warning",
  PENDING_ADMIN_REVIEW: "warning",
  "At Risk": "warning",
  InReview: "warning",
  OutOfStock: "warning",
  // danger
  Cancelled: "danger",
  Rejected: "danger",
  Suspended: "danger",
  Failed: "danger",
  "Appeal Rejected": "danger",
  REJECTED_BY_ADMIN: "danger",
  REJECTED_BY_SELLER: "danger",
  // info
  Shipped: "info",
  "Out for Delivery": "info",
  OutForDelivery: "info",
  Packed: "info",
  Dispatched: "info",
  "Appeal Pending": "info",
  PENDING_SELLER_REVIEW: "info",
  ITEM_IN_TRANSIT: "info",
  SELLER_RECEIVED: "info",
};

/** Map a backend status string to one of the four semantic tones. */
export const getStatusTone = (status) =>
  STATUS_TONES[status] || "neutral";

/**
 * Render a status as a pill chip.
 * @param {string} status - raw backend status text
 * @param {string} [label] - optional display override
 * @param {string} [tone] - force a tone instead of deriving from the status
 */
const StatusChip = ({ status = "", label, tone, style, className = "" }) => {
  const display = label ?? status;
  const t = tone || getStatusTone(status);
  return (
    <span
      className={`vv-chip vv-chip--${t} ${className}`.trim()}
      style={style}
    >
      {display}
    </span>
  );
};

export default StatusChip;
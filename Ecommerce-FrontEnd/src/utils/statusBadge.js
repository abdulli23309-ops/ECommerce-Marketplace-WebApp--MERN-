const STATUS_STYLES = {
  Delivered: { bg: "var(--success-bg)", text: "var(--success-text)" },
  Approved: { bg: "var(--success-bg)", text: "var(--success-text)" },
  Active: { bg: "var(--success-bg)", text: "var(--success-text)" },
  Completed: { bg: "var(--success-bg)", text: "var(--success-text)" },
  Refunded: { bg: "var(--success-bg)", text: "var(--success-text)" },
  Pending: { bg: "var(--warning-bg)", text: "var(--warning-text)" },
  Processing: { bg: "var(--warning-bg)", text: "var(--warning-text)" },
  Cancelled: { bg: "var(--danger-bg)", text: "var(--danger-text)" },
  Rejected: { bg: "var(--danger-bg)", text: "var(--danger-text)" },
  Suspended: { bg: "var(--danger-bg)", text: "var(--danger-text)" },
  "Appeal Rejected": { bg: "var(--danger-bg)", text: "var(--danger-text)" },
  "At Risk": { bg: "var(--warning-bg)", text: "var(--warning-text)" },
  "Appeal Pending": { bg: "var(--info-bg)", text: "var(--info-text)" },
  Shipped: { bg: "var(--info-bg)", text: "var(--info-text)" },
  "Out for Delivery": { bg: "var(--info-bg)", text: "var(--info-text)" },
  OutForDelivery: { bg: "var(--info-bg)", text: "var(--info-text)" },
  PENDING_ADMIN_REVIEW: { bg: "var(--warning-bg)", text: "var(--warning-text)" },
  PENDING_SELLER_REVIEW: { bg: "var(--info-bg)", text: "var(--info-text)" },
  APPROVED_PENDING_SHIPMENT: { bg: "var(--warning-bg)", text: "var(--warning-text)" },
  REJECTED_BY_ADMIN: { bg: "var(--danger-bg)", text: "var(--danger-text)" },
  REJECTED_BY_SELLER: { bg: "var(--danger-bg)", text: "var(--danger-text)" },
  ITEM_IN_TRANSIT: { bg: "var(--info-bg)", text: "var(--info-text)" },
  SELLER_RECEIVED: { bg: "var(--info-bg)", text: "var(--info-text)" },
  INSPECTED_AND_REFUNDED: { bg: "var(--success-bg)", text: "var(--success-text)" },
};

const DEFAULT_STYLE = { bg: "var(--bg-secondary)", text: "var(--text-secondary)" };

export const getStatusBadgeStyle = (status) => {
  const style = STATUS_STYLES[status] || DEFAULT_STYLE;
  return { backgroundColor: style.bg, color: style.text, padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 600, display: "inline-block" };
};

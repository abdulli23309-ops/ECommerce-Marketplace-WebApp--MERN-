/**
 * Shared status vocabulary for the customer order experience.
 *
 * Two dimensions are deliberately kept separate and must never be merged into a
 * single badge:
 *   PAYMENT    — how the money moved   -> getPaymentMethodLabel / getPaymentStatusLabel
 *   FULFILMENT — where the goods are   -> getFulfilmentStatus / getPackageStatus
 *
 * Backend vocabularies this maps from:
 *   Payment.method       Dummy | CashOnDelivery | Stripe | PayPal | JazzCash | EasyPaisa
 *   Payment.status       Pending | Completed | Failed | Refunded
 *   ParentOrder.status   Pending | Processing | Shipped | Delivered | Cancelled
 *   SellerOrder.status   Pending | Processing | Packed | Dispatched | OutForDelivery |
 *                        Shipped | Delivered | Cancelled
 *   Shipment / history   Pending | Packed | Dispatched | OutForDelivery | Delivered
 */

const COD = "CashOnDelivery";

const TONES = {
  success: { backgroundColor: "var(--success-bg)", color: "var(--success-text)" },
  info: { backgroundColor: "var(--info-bg)", color: "var(--info-text)" },
  warning: { backgroundColor: "var(--warning-bg)", color: "var(--warning-text)" },
  danger: { backgroundColor: "var(--danger-bg)", color: "var(--danger-text)" },
  neutral: { backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" },
};

/** Pill/chip style for a tone. Colours always resolve through theme tokens. */
export const getChipStyle = (tone = "neutral", overrides = {}) => ({
  ...(TONES[tone] || TONES.neutral),
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  padding: "0.25rem 0.65rem",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
  width: "fit-content",
  ...overrides,
});

/* ------------------------------------------------------------------ payment */

const METHOD_LABELS = {
  [COD]: "Cash on Delivery",
  Stripe: "Credit/Debit Card",
  EasyPaisa: "EasyPaisa",
  JazzCash: "JazzCash",
  PayPal: "PayPal",
  Dummy: "Test Payment",
};

const METHOD_SHORT_LABELS = { [COD]: "COD", Stripe: "Card", Dummy: "Test" };

export const getPaymentMethodLabel = (method) =>
  method ? METHOD_LABELS[method] || method : "—";

/** Compact form for dense rows (cards, headers). */
export const getPaymentMethodShortLabel = (method) =>
  method ? METHOD_SHORT_LABELS[method] || METHOD_LABELS[method] || method : "—";

/**
 * Cash on Delivery is unpaid by design until the courier collects the cash, so
 * its Pending payment must never read as "Payment Pending" (alarming) nor as
 * "Payment Successful" (untrue). It gets its own wording.
 */
export const getPaymentStatusLabel = (method, status) => {
  if (method === COD) {
    if (status === "Completed") return "Paid on Delivery";
    if (status === "Failed") return "Failed";
    if (status === "Refunded") return "Refunded";
    return "Payment on Delivery";
  }
  if (status === "Pending") return "Failed";
  return status || "—";
};

export const getPaymentTone = (method, status) => {
  if (status === "Failed" || (method !== COD && status === "Pending")) return "danger";
  if (status === "Completed" || status === "Refunded") return "success";
  if (method === COD) return "neutral"; // expected state, not a warning
  return "warning";
};

/**
 * True when a prepaid payment failed, i.e. the order never really started.
 * COD is excluded: it is unpaid until delivery by design.
 */
export const isPaymentFailed = (order) =>
  Boolean(order) && order.paymentMethod !== COD && order.paymentStatus === "Failed";

/* --------------------------------------------------------------- fulfilment */

const FULFILMENT_LABELS = {
  Pending: "Pending",
  Processing: "Processing",
  Packed: "Packed",
  Dispatched: "Shipped",
  Shipped: "Shipped",
  OutForDelivery: "Out for Delivery",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

/** Humanises a raw backend status (e.g. OutForDelivery -> Out for Delivery). */
export const formatStatusLabel = (status) =>
  FULFILMENT_LABELS[status] || status || "—";

const FULFILMENT_TONES = {
  Delivered: "success",
  Cancelled: "danger",
  "Out for Delivery": "info",
  Shipped: "info",
  Packed: "info",
  Processing: "warning",
  Pending: "warning",
};

export const getFulfilmentTone = (label) => FULFILMENT_TONES[label] || "neutral";

/**
 * Order-level fulfilment label, derived from the packages only — payment state
 * is never folded in. Precedence runs from most to least advanced.
 */
export const getFulfilmentStatus = (order) => {
  if (!order) return "Pending";
  if (order.orderStatus === "Cancelled") return "Cancelled";
  if (order.orderStatus === "Delivered") return "Delivered";

  const statuses = (order.sellerOrders || []).map((so) => so.status);
  if (statuses.includes("Cancelled")) return "Cancelled";
  if (statuses.includes("Delivered")) return "Delivered";
  if (statuses.includes("OutForDelivery")) return "Out for Delivery";
  if (statuses.some((s) => s === "Shipped" || s === "Dispatched")) return "Shipped";
  if (statuses.includes("Packed")) return "Packed";
  if (statuses.includes("Processing")) return "Processing";
  return "Pending";
};

/**
 * Status of a single package (SellerOrder). Each package is tracked on its own —
 * one package being Delivered never advances another.
 *
 * A Shipment row only appears once the seller begins fulfilment, and it starts
 * at 'Pending'; while it is still Pending the seller-order status (e.g.
 * Processing) is the more informative signal.
 */
export const getPackageStatus = (sellerOrder) => {
  if (!sellerOrder) return "Pending";
  if (sellerOrder.status === "Cancelled") return "Cancelled";

  const shipmentStatus = sellerOrder.shipment?.status;
  if (shipmentStatus && shipmentStatus !== "Pending") {
    return formatStatusLabel(shipmentStatus);
  }
  return formatStatusLabel(sellerOrder.status);
};

/* ------------------------------------------------------------------ filters */

export const ORDER_FILTERS = ["All Orders", "Active", "Delivered", "Cancelled"];

/** Filter predicate for the My Orders tabs. */
export const matchesOrderFilter = (order, filter) => {
  if (filter === "All Orders") return true;

  const failed = isPaymentFailed(order);
  const status = getFulfilmentStatus(order);

  if (filter === "Delivered") return !failed && status === "Delivered";
  if (filter === "Cancelled") return failed || status === "Cancelled";
  if (filter === "Active") return !failed && status !== "Delivered" && status !== "Cancelled";
  return true;
};

/* --------------------------------------------------------------------- time */

/** e.g. "24 Aug 2026, 10:32 am". Returns null when there is no usable date. */
export const formatOrderDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

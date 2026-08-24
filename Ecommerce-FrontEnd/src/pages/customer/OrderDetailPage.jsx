import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchOrderById,
  cancelOrder,
  fetchPaymentByOrder,
} from "../../services/orderService";
import { fetchMyReviews } from "../../services/reviewService";
import { formatPKR } from "../../utils/currency";
import { getImageUrl } from "../../utils/imageHelper";
import ProductThumb from "../../components/common/ProductThumb";
import {
  formatOrderDateTime,
  formatStatusLabel,
  getChipStyle,
  getFulfilmentTone,
  getPackageStatus,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentTone,
} from "../../utils/orderStatus";

const StoreIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0H7m0 0H5m0 0H3" />
    <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h2m4 0h.01" />
  </svg>
);

const InfoIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const BanIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M4.93 4.93l14.14 14.14" />
  </svg>
);

const noticeStyle = (tone) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: "8px",
  fontSize: "0.82rem",
  fontWeight: 500,
  background: `var(--${tone}-bg)`,
  color: `var(--${tone}-text)`,
});

const metaBlock = (label, value) => (
  <div>
    <span className="vv-meta-label">{label}</span>
    <div className="vv-meta-value">{value}</div>
  </div>
);

/**
 * Vertical tracking timeline built strictly from shipment.trackingHistory.
 * Latest event first and visually prominent; no future//assumed steps are ever
 * rendered, so a package that has only reached "Packed" never shows "Shipped".
 */
const TrackingTimeline = ({ history }) => {
  const events = [...(history || [])]
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b.timestamp || 0).getTime() -
        new Date(a.timestamp || 0).getTime()
    );

  if (events.length === 0) return null;

  return (
    <ol className="vv-timeline">
      {events.map((event, idx) => {
        const timestamp = formatOrderDateTime(event.timestamp);
        return (
          <li
            key={`${event.status}-${idx}`}
            className={`vv-timeline__item${
              idx === 0 ? " vv-timeline__item--current" : ""
            }`}
          >
            <span className="vv-timeline__dot" />
            <div className="vv-timeline__status">
              {formatStatusLabel(event.status)}
            </div>
            {timestamp && <div className="vv-timeline__time">{timestamp}</div>}
            {event.note && (
              <div className="vv-timeline__note">{event.note}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

const ShipmentPanel = ({ shipment }) => {
  if (!shipment) {
    return (
      <div style={noticeStyle("warning")}>
        <InfoIcon />
        <span>Awaiting shipment details from the seller.</span>
      </div>
    );
  }

  const hasHistory = (shipment.trackingHistory || []).length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="vv-meta-grid">
        {metaBlock("Carrier", shipment.carrier || "Not assigned")}
        {metaBlock("Tracking number", shipment.trackingNumber || "Not assigned")}
        {metaBlock(
          "Shipment status",
          <span
            style={getChipStyle(
              getFulfilmentTone(formatStatusLabel(shipment.status))
            )}
          >
            {formatStatusLabel(shipment.status)}
          </span>
        )}
      </div>

      {hasHistory ? (
        <div>
          <span className="vv-meta-label">Tracking history</span>
          <TrackingTimeline history={shipment.trackingHistory} />
        </div>
      ) : (
        <div style={noticeStyle("warning")}>
          <InfoIcon />
          <span>No tracking updates recorded yet.</span>
        </div>
      )}
    </div>
  );
};

/**
 * One card per SellerOrder. Each package carries its own status and its own
 * shipment timeline — a package is never shown as further along just because a
 * sibling package in the same order has moved ahead.
 */
const PackageCard = ({
  sellerOrder,
  index,
  packageCount,
  isReviewed,
  showActions,
}) => {
  const status = getPackageStatus(sellerOrder);
  const items = sellerOrder.items || [];

  return (
    <section className="vv-card">
      <div
        className="vv-split vv-split--stack"
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {packageCount > 1 && (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              Package {index + 1} of {packageCount}
            </span>
          )}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            <StoreIcon />
            {sellerOrder.store?.name || "Unknown store"}
          </span>
        </div>

        <span style={getChipStyle(getFulfilmentTone(status))}>{status}</span>
      </div>

      <div style={{ padding: "6px 20px 14px" }}>
        {items.map((item, idx) => (
          <div className="vv-line" key={`${sellerOrder._id}-${idx}`}>
            <ProductThumb
              src={getImageUrl(
                item.productImage || item.product?.images?.[0]
              )}
              alt={item.productNameSnapshot}
              size={44}
            />
            <div className="vv-line__main">
              <div className="vv-line__name">{item.productNameSnapshot}</div>
              <div className="vv-line__sub">
                Qty {item.quantity} × PKR {formatPKR(item.unitPriceSnapshot)}
              </div>
            </div>
            <span className="vv-line__total">
              PKR {formatPKR(item.unitPriceSnapshot * item.quantity)}
            </span>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            paddingTop: "12px",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          <span>Package subtotal</span>
          <strong style={{ color: "var(--text-primary)" }}>
            PKR {formatPKR(sellerOrder.subTotal)}
          </strong>
        </div>
      </div>

      <div style={{ padding: "0 20px 16px" }}>
        <ShipmentPanel shipment={sellerOrder.shipment} />
      </div>

      {showActions && sellerOrder.status === "Delivered" && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            flexWrap: "wrap",
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-secondary)",
          }}
        >
          <div className="vv-actions" style={{ justifyContent: "flex-end" }}>
            {isReviewed ? (
              <span
                style={{
                  alignSelf: "center",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                Review submitted ✓
              </span>
            ) : (
              <Link
                to={`/review/new/${sellerOrder._id}`}
                className="vv-btn vv-btn--ghost"
              >
                Write a Review
              </Link>
            )}
            <Link
              to={`/returns/new/${sellerOrder._id}`}
              className="vv-btn vv-btn--ghost"
            >
              Request Return
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const orderData = await fetchOrderById(orderId);
        const reviewsRes = await fetchMyReviews({ pageSize: 100 });
        const allReviews = reviewsRes.items || [];
        const reviewedSellerOrderIds = new Set(
          allReviews.map((r) => (r.sellerOrder?._id || r.sellerOrder).toString())
        );
        orderData.reviewedSellerOrderIds = reviewedSellerOrderIds;
        setOrder(orderData);
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  // Fetch payment separately
  useEffect(() => {
    if (!orderId) return;
    fetchPaymentByOrder(orderId)
      .then((data) => setPayment(data))
      .catch(() => setPayment(null));
  }, [orderId]);

  const handleCancelClick = () => setIsCancelModalOpen(true);

  const handleConfirmCancel = async () => {
    setIsCancelModalOpen(false);
    setCancelling(true);
    try {
      await cancelOrder(orderId);
      const updatedOrder = await fetchOrderById(orderId);
      setOrder(updatedOrder);
    } catch (err) {
      console.error("Failed to cancel order", err);
      alert("Could not cancel the order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const isCancelled = order?.orderStatus === "Cancelled";

  const isStripeRefundCancellation =
    order?.orderStatus === "Processing" &&
    payment?.method === "Stripe" &&
    payment?.status === "Completed";

  const canCancel = order && !isCancelled && (
    (
      order.orderStatus === 'Pending' &&
      !(order.sellerOrders || []).some(so =>
        ['Processing', 'Shipped', 'Dispatched', 'OutForDelivery', 'Delivered', 'Cancelled'].includes(so.status)
      )
    ) ||
    (
      isStripeRefundCancellation &&
      !(order.sellerOrders || []).some(so => so.status !== 'Pending')
    )
  );

  if (loading) {
    return (
      <div className="vv-orders-page">
        <div className="vv-orders-shell">
          <div
            className="vv-card"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            Loading order...
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="vv-orders-page">
        <div className="vv-orders-shell">
          <div
            className="vv-card"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            Order not found.
          </div>
        </div>
      </div>
    );
  }

  const paymentMethod = payment?.method ?? null;
  const paymentStatus = payment?.status ?? null;
  const packages = order.sellerOrders || [];
  const placedAt = formatOrderDateTime(order.createdAt);

  return (
    <div className="vv-orders-page">
      <div className="vv-orders-shell">
        <Link
          to="/orders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            width: "fit-content",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            textDecoration: "none",
          }}
        >
          ← Back to orders
        </Link>

        {/* ------------------------------------------------ order header ---- */}
        <section className="vv-card" style={{ padding: "20px" }}>
          <div
            className="vv-split vv-split--stack"
            style={{ marginBottom: "18px" }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                }}
              >
                Order #{order._id.slice(0, 8).toUpperCase()}
              </h1>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                {packages.length} {packages.length === 1 ? "package" : "packages"}
                {placedAt ? ` · placed ${placedAt}` : ""}
              </p>
            </div>

            {canCancel && (
              <div className="vv-actions" style={{ justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="vv-btn vv-btn--danger"
                  onClick={handleCancelClick}
                  disabled={cancelling}
                >
                  {cancelling
                    ? "Cancelling..."
                    : isStripeRefundCancellation
                      ? "Cancel & Refund"
                      : "Cancel Order"}
                </button>
              </div>
            )}
          </div>

          <div className="vv-meta-grid">
            {metaBlock("Placed", placedAt || "—")}
            {metaBlock(
              "Order total",
              `PKR ${formatPKR(order.totalAmount || 0)}`
            )}
            {metaBlock("Payment method", getPaymentMethodLabel(paymentMethod))}
            {metaBlock(
              "Payment status",
              <span style={getChipStyle(getPaymentTone(paymentMethod, paymentStatus))}>
                {getPaymentStatusLabel(paymentMethod, paymentStatus)}
              </span>
            )}
          </div>

          {isCancelled && (
            <div style={{ ...noticeStyle("danger"), marginTop: "16px" }}>
              <BanIcon />
              <span>This order has been cancelled.</span>
            </div>
          )}
        </section>

        {/* ----------------------------------------------- payment card ----- */}
        <section className="vv-card" style={{ padding: "20px" }}>
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Payment
          </h2>
          <div className="vv-meta-grid">
            {metaBlock("Method", getPaymentMethodLabel(paymentMethod))}
            {metaBlock(
              "Status",
              <span style={getChipStyle(getPaymentTone(paymentMethod, paymentStatus))}>
                {getPaymentStatusLabel(paymentMethod, paymentStatus)}
              </span>
            )}
            {metaBlock(
              "Amount",
              `PKR ${formatPKR(payment?.amount ?? order.totalAmount ?? 0)}`
            )}
          </div>
          {paymentMethod === "CashOnDelivery" && paymentStatus !== "Completed" && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
              }}
            >
              Pay the courier in cash when your order arrives.
            </p>
          )}
        </section>

        {/* -------------------------------------------------- packages ------ */}
        <div>
          <h2
            style={{
              margin: "4px 0 12px",
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {packages.length === 1 ? "Package" : "Packages"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {packages.length === 0 && (
              <div
                className="vv-card"
                style={{
                  padding: "24px",
                  textAlign: "center",
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                }}
              >
                No packages found for this order.
              </div>
            )}
            {packages.map((so, idx) => (
              <PackageCard
                key={so._id}
                sellerOrder={so}
                index={idx}
                packageCount={packages.length}
                isReviewed={Boolean(
                  order.reviewedSellerOrderIds?.has(so._id.toString())
                )}
                showActions={!isCancelled}
              />
            ))}
          </div>
        </div>
      </div>

      {isCancelModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setIsCancelModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              padding: "32px",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "400px",
              boxShadow:
                "0 20px 25px -5px var(--shadow), 0 10px 10px -5px var(--shadow)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              style={{
                width: 48,
                height: 48,
                color: "var(--danger)",
                marginBottom: 16,
              }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 8px",
              }}
            >
              Cancel this order?
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {isStripeRefundCancellation
                ? "Are you sure you want to cancel this order? Your payment will be automatically refunded to your original payment method. This action cannot be undone."
                : "Are you sure you want to cancel this order? This action cannot be undone and the seller will be notified."}
            </p>
            <div
              style={{ display: "flex", gap: 12, width: "100%", marginTop: 24 }}
            >
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="vv-btn vv-btn--ghost"
                style={{ flex: 1, padding: "12px" }}
              >
                Nevermind
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="vv-btn"
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "var(--danger)",
                  color: "#fff",
                }}
              >
                {isStripeRefundCancellation ? "Cancel & Refund" : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;

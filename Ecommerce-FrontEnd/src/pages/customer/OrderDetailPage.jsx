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
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toastError } from "../../components/common/Toast";
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
 * One card per SellerOrder. Each package represents an independent seller's
 * order partition with its own status, items, financial details, and shipment timeline.
 */
const PackageCard = ({
  sellerOrder,
  index,
  packageCount,
  reviewedItemKeys,
  showActions,
}) => {
  const status = getPackageStatus(sellerOrder);
  const items = sellerOrder.items || [];
  const storeCity = sellerOrder.store?.city;

  const allItemsReviewed =
    items.length > 0 &&
    items.every((item) => {
      const pId = item.product?._id || item.product;
      return reviewedItemKeys?.has(`${sellerOrder._id}_${pId}`);
    });

  return (
    <section className="vv-card" style={{ overflow: "hidden" }}>
      {/* Seller / Store Order Section Header */}
      <div
        className="vv-split vv-split--stack"
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {packageCount > 1 && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  background: "var(--surface)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                }}
              >
                Seller Section {index + 1} of {packageCount}
              </span>
            )}
            <span
              style={{
                fontSize: "0.75rem",
                fontFamily: "monospace",
                color: "var(--text-secondary)",
              }}
            >
              ID: #{sellerOrder._id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginTop: "2px",
            }}
          >
            <StoreIcon />
            <span>{sellerOrder.store?.name || "Unknown Store"}</span>
            {storeCity && (
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                ({storeCity})
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={getChipStyle(getFulfilmentTone(status))}>{status}</span>
        </div>
      </div>

      {/* Seller Order Items */}
      <div style={{ padding: "8px 20px 14px" }}>
        {items.map((item, idx) => {
          const productId = item.product?._id || item.product;
          const isItemReviewed = reviewedItemKeys?.has(`${sellerOrder._id}_${productId}`);

          return (
            <div
              className="vv-line"
              key={`${sellerOrder._id}-${idx}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 0",
                borderBottom: idx < items.length - 1 ? "1px solid var(--border-light, rgba(0,0,0,0.05))" : "none",
              }}
            >
              <ProductThumb
                src={getImageUrl(
                  item.productImage || item.product?.images?.[0]
                )}
                alt={item.productNameSnapshot}
                size={48}
              />
              <div className="vv-line__main" style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="vv-line__name"
                  style={{
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    fontSize: "0.95rem",
                  }}
                >
                  {item.productNameSnapshot}
                </div>
                <div
                  className="vv-line__sub"
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    marginTop: "2px",
                  }}
                >
                  Qty {item.quantity} × PKR {formatPKR(item.unitPriceSnapshot)}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                <span
                  className="vv-line__total"
                  style={{
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    fontSize: "0.95rem",
                  }}
                >
                  PKR {formatPKR(item.unitPriceSnapshot * item.quantity)}
                </span>

                {showActions && sellerOrder.status === "Delivered" && items.length > 1 && (
                  <div style={{ display: "flex", gap: "6px" }}>
                    {isItemReviewed ? (
                      <span style={{ fontSize: "0.75rem", color: "var(--success-text)", fontWeight: 500 }}>
                        Reviewed ✓
                      </span>
                    ) : (
                      <Link
                        to={`/review/new/${sellerOrder._id}?productId=${productId}`}
                        style={{ fontSize: "0.78rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
                      >
                        Review
                      </Link>
                    )}
                    <span style={{ color: "var(--border)" }}>•</span>
                    <Link
                      to={`/returns/new/${sellerOrder._id}?productId=${productId}`}
                      style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}
                    >
                      Return
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Financial Subtotals for this Seller Order */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "4px",
            paddingTop: "12px",
            borderTop: "1px solid var(--border)",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <span>Items subtotal</span>
            <strong style={{ color: "var(--text-primary)" }}>
              PKR {formatPKR(sellerOrder.subTotal)}
            </strong>
          </div>
          {Number(sellerOrder.deliveryCharge || 0) > 0 && (
            <div style={{ display: "flex", gap: "12px", fontSize: "0.82rem" }}>
              <span>Seller delivery charge</span>
              <span>PKR {formatPKR(sellerOrder.deliveryCharge)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Seller Specific Shipment & Tracking History */}
      <div style={{ padding: "0 20px 16px" }}>
        <ShipmentPanel shipment={sellerOrder.shipment} />
      </div>

      {/* Seller Order Level Actions */}
      {showActions && sellerOrder.status === "Delivered" && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-secondary)",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Fulfillment and returns are handled by {sellerOrder.store?.name || "the seller"}.
          </span>
          <div className="vv-actions" style={{ justifyContent: "flex-end" }}>
            {allItemsReviewed ? (
              <span
                style={{
                  alignSelf: "center",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                All items reviewed ✓
              </span>
            ) : (
              <Link
                to={`/review/new/${sellerOrder._id}`}
                className="vv-btn vv-btn--ghost"
              >
                Write a Review
              </Link>
            )}
            {sellerOrder.returnInfo?.exists && sellerOrder.returnInfo?.returnId ? (
              <Link to="/returns" className="vv-btn vv-btn--ghost">
                View Return
              </Link>
            ) : sellerOrder.returnInfo && !sellerOrder.returnInfo.canRequestReturn ? (
              <span
                style={{
                  alignSelf: "center",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                Return window closed
              </span>
            ) : (
              <Link
                to={`/returns/new/${sellerOrder._id}`}
                className="vv-btn vv-btn--ghost"
              >
                Request Return
              </Link>
            )}
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
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const orderData = await fetchOrderById(orderId);
        const reviewsRes = await fetchMyReviews({ pageSize: 100 });
        const allReviews = reviewsRes.items || [];
        const reviewedItemKeys = new Set(
          allReviews.map((r) => {
            const sId = r.sellerOrder?._id || r.sellerOrder;
            const pId = r.product?._id || r.product;
            return `${sId}_${pId}`;
          })
        );
        orderData.reviewedItemKeys = reviewedItemKeys;
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

  const handleCancelClick = () => setShowCancelDialog(true);

  const handleConfirmCancel = async () => {
    setShowCancelDialog(false);
    setCancelling(true);
    try {
      await cancelOrder(orderId);
      const updatedOrder = await fetchOrderById(orderId);
      setOrder(updatedOrder);
    } catch (err) {
      console.error("Failed to cancel order", err);
      toastError("Could not cancel the order. Please try again.");
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
                reviewedItemKeys={order.reviewedItemKeys}
                showActions={!isCancelled}
              />
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel this order?"
        message={
          isStripeRefundCancellation
            ? "Are you sure you want to cancel this order? Your payment will be automatically refunded to your original payment method. This action cannot be undone."
            : "Are you sure you want to cancel this order? This action cannot be undone and the seller will be notified."
        }
        confirmLabel={isStripeRefundCancellation ? "Cancel & Refund" : "Cancel Order"}
        cancelLabel="Nevermind"
        variant="danger"
        loading={cancelling}
      />
    </div>
  );
};

export default OrderDetailPage;

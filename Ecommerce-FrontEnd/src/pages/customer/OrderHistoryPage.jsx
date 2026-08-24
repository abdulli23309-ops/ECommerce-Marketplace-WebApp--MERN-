import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchOrders, fetchPaymentByOrder } from "../../services/orderService";
import { formatPKR } from "../../utils/currency";
import { getImageUrl } from "../../utils/imageHelper";
import ProductThumb from "../../components/common/ProductThumb";
import {
  ORDER_FILTERS,
  getChipStyle,
  getFulfilmentStatus,
  getFulfilmentTone,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentTone,
  isPaymentFailed,
  matchesOrderFilter,
} from "../../utils/orderStatus";

const StoreIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0H7m0 0H5m0 0H3" />
    <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h2m4 0h.01" />
  </svg>
);

const AlertIcon = () => (
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
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All Orders");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchOrders({ page, pageSize: 10 });
      const rawOrders = res.items || [];
      setTotalPages(res.totalPages || 1);

      // Fetch payment details for each order individually.
      const enrichedOrders = await Promise.all(
        rawOrders.map(async (order) => {
          try {
            const payment = await fetchPaymentByOrder(order._id);
            return {
              ...order,
              paymentMethod: payment?.method || null,
              paymentStatus: payment?.status || null,
            };
          } catch (err) {
            return {
              ...order,
              paymentMethod: null,
              paymentStatus: null,
            };
          }
        })
      );

      setOrders(enrichedOrders);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const filteredOrders = orders.filter((order) =>
    matchesOrderFilter(order, activeFilter)
  );

  const pageHeader = (
    <header>
      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        My Orders
      </h1>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: "0.925rem",
          color: "var(--text-secondary)",
        }}
      >
        Track purchases, payments, and deliveries in one place.
      </p>
    </header>
  );

  if (loading) {
    return (
      <div className="vv-orders-page">
        <div className="vv-orders-shell">
          {pageHeader}
          <div
            className="vv-card"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            Loading orders...
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="vv-orders-page">
        <div className="vv-orders-shell">
          {pageHeader}
          <div
            className="vv-card"
            style={{ padding: "56px 24px", textAlign: "center" }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              No orders yet
            </p>
            <p
              style={{
                margin: "8px 0 20px",
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
              }}
            >
              When you place an order, it will appear here.
            </p>
            <Link to="/products" className="vv-btn vv-btn--primary">
              Start shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vv-orders-page">
      <div className="vv-orders-shell">
        {pageHeader}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {ORDER_FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`vv-pill${activeFilter === cat ? " vv-pill--active" : ""}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div
            className="vv-card"
            style={{
              padding: "40px 24px",
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
            }}
          >
            No orders in “{activeFilter}”.
          </div>
        )}

        {filteredOrders.map((order) => {
          // Fulfilment and payment are resolved independently — the card shows
          // each on its own row and never merges them into one badge.
          const fulfilment = getFulfilmentStatus(order);
          const failed = isPaymentFailed(order);
          const paymentStatusLabel = getPaymentStatusLabel(
            order.paymentMethod,
            order.paymentStatus
          );

          const packages = order.sellerOrders || [];
          const items = packages.flatMap((so) => so.items || []);
          const previewItem = items[0];
          const extraItems = Math.max(0, items.length - 1);

          const storeNames = [
            ...new Set(packages.map((so) => so.store?.name).filter(Boolean)),
          ];
          const extraStores = Math.max(0, storeNames.length - 1);

          return (
            <article
              className={`vv-card${failed ? " vv-card--failed" : ""}`}
              key={order._id}
            >
              <div
                className="vv-split vv-split--stack"
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    #{order._id.slice(0, 8).toUpperCase()}
                  </div>
                  <div
                    style={{
                      marginTop: "2px",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={getChipStyle(getFulfilmentTone(fulfilment))}>
                    {fulfilment}
                  </span>
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    PKR {formatPKR(order.totalAmount || 0)}
                  </span>
                </div>
              </div>

              {failed && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    background: "var(--danger-bg)",
                    color: "var(--danger-text)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <AlertIcon />
                  <span>
                    Payment failed — this order was not completed. No delivery is
                    scheduled.
                  </span>
                </div>
              )}

              <div style={{ padding: "14px 20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "6px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  <StoreIcon />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {storeNames[0] || "Unknown store"}
                  </span>
                  {extraStores > 0 && (
                    <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                      +{extraStores} more{" "}
                      {extraStores === 1 ? "store" : "stores"}
                    </span>
                  )}
                </div>

                {previewItem && (
                  <div className="vv-line">
                    <ProductThumb
                      src={getImageUrl(
                        previewItem.productImage ||
                          previewItem.product?.images?.[0]
                      )}
                      alt={previewItem.productNameSnapshot}
                      size={48}
                    />
                    <div className="vv-line__main">
                      <div className="vv-line__name">
                        {previewItem.productNameSnapshot}
                      </div>
                      <div className="vv-line__sub">
                        Qty {previewItem.quantity}
                        {extraItems > 0 && (
                          <> · +{extraItems} more {extraItems === 1 ? "item" : "items"}</>
                        )}
                      </div>
                    </div>
                    <span className="vv-line__total">
                      PKR{" "}
                      {formatPKR(
                        previewItem.unitPriceSnapshot * previewItem.quantity
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div
                className="vv-split vv-split--stack"
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                  <span
                    style={getChipStyle(
                      getPaymentTone(order.paymentMethod, order.paymentStatus)
                    )}
                  >
                    {paymentStatusLabel}
                  </span>
                </div>

                <div className="vv-actions">
                  <Link
                    to={`/orders/${order._id}`}
                    className="vv-btn vv-btn--primary"
                  >
                    View Order
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
              marginTop: "4px",
            }}
          >
            <button
              type="button"
              className="vv-btn vv-btn--ghost"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span
              style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
            >
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="vv-btn vv-btn--ghost"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;

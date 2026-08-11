import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchSellerOrders } from "../../services/sellerOrderService";

const statusPillStyle = (status) => {
  const base = {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    display: "inline-block",
    whiteSpace: "nowrap",
  };
  switch (status) {
    case "Delivered":
      return { ...base, backgroundColor: "#d1fae5", color: "#065f46" };
    case "Processing":
    case "Pending":
    case "OutForDelivery":
      return { ...base, backgroundColor: "#fef3c7", color: "#92400e" };
    case "Cancelled":
      return { ...base, backgroundColor: "#fee2e2", color: "#991b1b" };
    default:
      return { ...base, backgroundColor: "#f3f4f6", color: "#1f2937" };
  }
};

// Helper to render item summary
const renderItemSummary = (sellerOrders) => {
  const allItems = sellerOrders.flatMap(so => so.items || []);
  if (allItems.length === 0) return "No items";
  const first = allItems[0];
  const restCount = allItems.length - 1;
  return (
    <div style={{ fontSize: "0.85rem", color: "#374151" }}>
      <span style={{ fontWeight: 500 }}>
        {first.productNameSnapshot || first.product?.name || "Product"}
      </span>
      <span style={{ color: "#6b7280" }}> (x{first.quantity})</span>
      {restCount > 0 && (
        <span style={{ color: "#2563eb", fontWeight: 500, marginLeft: "0.25rem" }}>
          + {restCount} more item{restCount > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
};

// Payment method icon
const PaymentIcon = ({ method }) => {
  if (method === 'Stripe') return '💳 Card';
  if (method === 'CashOnDelivery') return '💵 COD';
  if (method === 'Dummy') return '🧪 Dummy';
  return '💳 ' + method;
};

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchSellerOrders({ page, pageSize: 10 });
      setOrders(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load seller orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page]);

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading orders...</div>;
  if (orders.length === 0) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
        No orders yet.
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Your Orders</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {orders.map((order) => {
          const sellerOrders = order.sellerOrders || [];
          const displayStatus = order.orderStatus;

          return (
            <div
              key={order._id}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                padding: "1.25rem 1.5rem",
                transition: "box-shadow 0.2s, transform 0.1s",
                cursor: "default",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)")}
            >
              {/* Three-column grid */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                {/* Left – Order Meta */}
                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>
                    Order #{order._id.toString().slice(-8).toUpperCase()}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <PaymentIcon method={order.paymentMethod} />
                  </div>
                </div>

                {/* Middle – Fulfillment Context */}
                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111827" }}>
                    {order.customerName}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    📍 {order.shippingLocation || '—'}
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    {renderItemSummary(sellerOrders)}
                  </div>
                </div>

                {/* Right – Financials & Status */}
                <div style={{ flex: "0 0 auto", textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>
                    PKR {order.totalAmount?.toLocaleString()}
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    <span style={statusPillStyle(displayStatus)}>
                      {displayStatus}
                    </span>
                  </div>
                  <div style={{ marginTop: "0.75rem" }}>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "#6b7280" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;
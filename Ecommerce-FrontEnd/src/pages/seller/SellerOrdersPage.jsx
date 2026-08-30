import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchSellerOrders } from "../../services/sellerOrderService";
import { getStatusBadgeStyle } from "../../utils/statusBadge";
import { TableSkeleton } from "../../components/common/Skeleton";
import Pagination from "../../components/common/Pagination";
import ErrorState from "../../components/common/ErrorState";

const renderItemSummary = (sellerOrders) => {
  const allItems = sellerOrders.flatMap(so => so.items || []);
  if (allItems.length === 0) return "No items";
  const first = allItems[0];
  const restCount = allItems.length - 1;
  return (
    <div style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
      <span style={{ fontWeight: 500 }}>
        {first.productNameSnapshot || first.product?.name || "Product"}
      </span>
      <span style={{ color: "var(--text-secondary)" }}> (x{first.quantity})</span>
      {restCount > 0 && (
        <span style={{ color: "var(--info)", fontWeight: 500, marginLeft: "0.25rem" }}>
          + {restCount} more item{restCount > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
};

const PaymentIcon = ({ method }) => {
  if (method === 'Stripe') return '💳 Card';
  if (method === 'CashOnDelivery') return '💵 COD';
  if (method === 'Dummy') return '🧪 Dummy';
  return '💳 ' + method;
};

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSellerOrders({ page, pageSize: 10 });
      setOrders(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load seller orders", err);
      setError(err.response?.status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>Your Orders</h2>
        <TableSkeleton rows={5} header={false} />
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>Your Orders</h2>
        <ErrorState statusCode={error} onRetry={() => loadOrders()} />
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>Your Orders</h2>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>Your Orders</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {orders.map((order) => {
          const sellerOrders = order.sellerOrders || [];
          const displayStatus = order.orderStatus;

          return (
            <div
              key={order._id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                padding: "1.25rem 1.5rem",
                transition: "box-shadow 0.2s, transform 0.1s",
                cursor: "default",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)")}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
                    Order #{order._id.toString().slice(-8).toUpperCase()}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <PaymentIcon method={order.paymentMethod} />
                  </div>
                </div>

                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    {order.customerName}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    📍 {order.shippingLocation || '—'}
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    {renderItemSummary(sellerOrders)}
                  </div>
                </div>

                <div style={{ flex: "0 0 auto", textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                    PKR {order.totalAmount?.toLocaleString()}
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    <span style={getStatusBadgeStyle(displayStatus)}>
                      {displayStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        showPageSize={false}
        ariaLabel="Orders pagination"
      />
    </div>
  );
};

export default SellerOrdersPage;
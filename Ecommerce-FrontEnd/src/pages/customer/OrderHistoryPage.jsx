import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchOrders } from "../../services/orderService";

const statusColors = {
  Pending: "#666",
  Processing: "#000",
  Shipped: "#000",
  Delivered: "#000",
  Canceled: "#999",
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (loading) {
    return <div style={{ padding: "3rem", color: "#666" }}>Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-page">
        <div className="cart-empty">
          <h2>No orders yet</h2>
          <p>When you place an order, it will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <h2 className="section-title">Your Orders</h2>

      {orders.map((order) => {
        const firstStore = order.sellerOrders?.[0]?.storeName || "Unknown";
        const extraSellers = order.sellerOrders?.length > 1 ? ` +${order.sellerOrders.length - 1} more` : "";
        const totalItems = order.sellerOrders?.reduce((sum, so) => sum + so.items?.length, 0) || 0;

        return (
          <div className="order-card" key={order.parentOrderId}>
            <div
              className="order-card-header"
              onClick={() => toggleOrder(order.parentOrderId)}
            >
              <div>
                <Link
                  to={`/orders/${order.parentOrderId}`}
                  className="order-id-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Order #{order.parentOrderId.slice(0, 8).toUpperCase()}
                </Link>
                <span className="order-date">
                  {" "}· {new Date(order.orderDate).toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span
                  className="order-status-badge"
                  style={{
                    backgroundColor: statusColors[order.orderStatus] || "#666",
                    color: "#fff",
                    padding: "0.2rem 0.75rem",
                    borderRadius: "1rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {order.orderStatus}
                </span>
                <span className="order-total">PKR {order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="order-card-summary" style={{ padding: "0 1.5rem 0.75rem", color: "#666", fontSize: "0.85rem" }}>
              <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
              <span> · </span>
              <span>{firstStore}{extraSellers}</span>
            </div>

            {expandedOrderId === order.parentOrderId && (
              <div className="order-card-body">
                {order.sellerOrders.map((so) => (
                  <div className="seller-order" key={so.sellerOrderId}>
                    <div className="seller-order-header">
                      <span className="seller-store-name">{so.storeName}</span>
                      <span className="seller-order-status">{so.status}</span>
                    </div>
                    {so.items.map((item, idx) => (
                      <div className="order-item" key={idx}>
                        <span className="order-item-name">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="order-item-price">
                          PKR {(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div style={{ textAlign: "right", fontWeight: 600, marginTop: "0.5rem", color: "#000" }}>
                      Subtotal: PKR {so.subTotal.toLocaleString()}
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: "right", marginTop: "1rem" }}>
                  <Link
                    to={`/orders/${order.parentOrderId}`}
                    className="btn-edit"
                    style={{ textDecoration: "underline", fontWeight: 600, fontSize: "0.9rem" }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderHistoryPage;
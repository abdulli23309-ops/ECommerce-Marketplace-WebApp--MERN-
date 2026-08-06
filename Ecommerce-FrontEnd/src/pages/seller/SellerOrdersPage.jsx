import { useState, useEffect } from "react";
import { fetchSellerOrders, updateShipmentStatus } from "../../services/sellerOrderService";

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchSellerOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to load seller orders", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleStatusChange = async (shipmentId, newStatus) => {
    try {
      await updateShipmentStatus(shipmentId, newStatus, "");
      loadOrders();
    } catch (err) {
      console.error("Failed to update shipment status", err);
    }
  };

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading orders...</div>;

  return (
    <div>
      <h2 className="section-title">Orders</h2>
      {orders.length === 0 ? (
        <div className="empty-state">No orders yet.</div>
      ) : (
        orders.map((order) => (
          <div className="order-card" key={order._id}>
            <div className="order-card-header" onClick={() => toggleOrder(order._id)}>
              <div>
                <span className="order-id">Order #{order._id.slice(0, 8).toUpperCase()}</span>
                <span className="order-date"> · {new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <span className="order-status">{order.orderStatus || order.status || "Unknown"}</span>
              <span className="order-total">PKR {Number(order.totalAmount ?? 0).toLocaleString()}</span>
            </div>

            {expandedOrderId === order._id && (
              <div className="order-card-body">
                {order.sellerOrders.map((so) => (
                  <div className="seller-order" key={so._id}>
                    <div className="seller-order-header">
                      <span className="seller-store-name">{so.store?.name || so.storeName || "Store"}</span>
                      <span className="seller-order-status">{so.status}</span>
                    </div>
                    {so.items.map((item, idx) => (
                      <div className="order-item" key={idx}>
                        <span className="order-item-name">
                          {item.productNameSnapshot || item.productName} × {item.quantity}
                        </span>
                        <span className="order-item-price">
                          PKR {Number((item.unitPriceSnapshot ?? item.unitPrice ?? 0) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div style={{ textAlign: "right", fontWeight: 600, marginTop: "0.5rem" }}>
                      Subtotal: PKR {Number(so.subTotal ?? 0).toLocaleString()}
                    </div>

                    {so.shipment && (
                      <div style={{ marginTop: "1rem", padding: "1rem", background: "#f9fafb", borderRadius: "0.5rem" }}>
                        <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                          Tracking: {so.shipment.trackingNumber || "N/A"} ({so.shipment.status})
                        </p>
                        <div className="order-actions">
                          <select
                            className="shipment-select"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) handleStatusChange(so.shipment._id, e.target.value);
                              e.target.value = "";
                            }}
                          >
                            <option value="" disabled>
                              Update Status
                            </option>
                            <option value="Packed">Packed</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="OutForDelivery">Out For Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default SellerOrdersPage;
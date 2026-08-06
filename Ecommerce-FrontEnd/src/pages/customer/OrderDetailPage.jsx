import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchOrderById } from "../../services/orderService";
import axiosInstance from "../../services/axiosInstance";

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewedItemIds, setReviewedItemIds] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const [orderData, reviewsData] = await Promise.all([
          fetchOrderById(orderId),
          axiosInstance.get("/reviews/my").then(res => res.data),
        ]);
        setOrder(orderData);
        // Build a set of order item IDs that already have a review
        const reviewedIds = new Set((reviewsData || []).map(r => r.orderItemId));
        setReviewedItemIds(reviewedIds);
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  const statusSteps = ["Pending", "Processing", "Shipped", "Delivered"];
  const currentStep = statusSteps.indexOf(order?.orderStatus);

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading order...</div>;
  if (!order) return <div style={{ padding: "2rem", color: "#666" }}>Order not found.</div>;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
      <Link to="/orders" className="back-link">← Back to orders</Link>
      <h2 className="section-title">Order #{order.parentOrderId.slice(0, 8).toUpperCase()}</h2>

      {/* Status progress bar */}
      <div className="order-progress">
        {statusSteps.map((step, idx) => (
          <div
            key={step}
            className={`progress-step ${idx <= currentStep ? "active" : ""}`}
            style={{
              flex: 1,
              textAlign: "center",
              position: "relative",
              color: idx <= currentStep ? "#000" : "#ccc",
              fontWeight: idx <= currentStep ? 600 : 400,
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: idx <= currentStep ? "#000" : "#ddd",
                margin: "0 auto 0.25rem",
              }}
            />
            {step}
          </div>
        ))}
      </div>

      <div className="order-meta" style={{ margin: "1.5rem 0", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <span>Placed: {new Date(order.orderDate).toLocaleString()}</span>
        <span>Total: <strong>PKR {order.totalAmount.toLocaleString()}</strong></span>
      </div>

      {order.sellerOrders.map((so) => (
        <div className="order-card" key={so.sellerOrderId}>
          <div className="order-card-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
            <span style={{ fontWeight: 600 }}>Seller: {so.storeName}</span>
            <span style={{ color: "#666", fontSize: "0.85rem" }}>Sub‑status: {so.status}</span>
          </div>

          <table className="product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {so.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.productName}</td>
                  <td>PKR {item.unitPrice}</td>
                  <td>{item.quantity}</td>
                  <td>PKR {(item.unitPrice * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: "right", fontWeight: 600, margin: "0.5rem 0" }}>
            Subtotal: PKR {so.subTotal.toLocaleString()}
          </div>

          {/* "Write a Review" link for each delivered item not already reviewed */}
          {so.items.map((item) => (
            <div key={item.orderItemId} style={{ marginTop: "0.25rem" }}>
              {so.shipment?.status === "Delivered" && !reviewedItemIds.has(item.orderItemId) && (
                <Link
                  to={`/review/new/${item.orderItemId}`}
                  className="btn-edit"
                  style={{ fontSize: "0.8rem", textDecoration: "underline" }}
                >
                  Write a Review
                </Link>
              )}
              {so.shipment?.status === "Delivered" && reviewedItemIds.has(item.orderItemId) && (
                <span style={{ fontSize: "0.8rem", color: "#999" }}>Review submitted ✓</span>
              )}
            </div>
          ))}

          {/* Shipment & Tracking */}
          {so.shipment ? (
            <div className="shipment-info">
              <h4>Shipment</h4>
              <p>Carrier: {so.shipment.carrier || "N/A"} | Tracking: {so.shipment.trackingNumber || "N/A"}</p>
              <p>Status: <strong>{so.shipment.status}</strong></p>
              <div className="tracking-history">
                {so.shipment.trackingHistory?.map((th, i) => (
                  <div key={i} className="tracking-step">
                    <span>{th.status}</span>
                    {th.location && <span> – {th.location}</span>}
                    <span className="tracking-time">{new Date(th.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: "#666", fontSize: "0.875rem" }}>No shipment created yet.</p>
          )}

          {/* Actions */}
          <div className="order-actions" style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {order.orderStatus === "Pending" && (
              <button className="btn-remove" style={{ fontWeight: 600, border: "1px solid #eaeaea", background: "#fff", padding: "0.5rem 1rem", cursor: "pointer" }}>
                Cancel Order
              </button>
            )}
            {so.shipment?.status === "Delivered" && (
  <Link
    to={`/returns/new/${item.orderItemId}`}
    className="btn-edit"
    style={{ fontSize: "0.8rem", textDecoration: "underline", marginLeft: "1rem" }}
  >
    Request Return
  </Link>
)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderDetailPage;
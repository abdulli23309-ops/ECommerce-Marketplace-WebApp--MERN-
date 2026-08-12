import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchOrderById, cancelOrder } from "../../services/orderService";
import { fetchMyReviews } from "../../services/reviewService";

const statusSteps = ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"];

// ---------- Stepper Component ----------
const StepProgress = ({ currentStep, isCancelled }) => {
  if (isCancelled) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '2rem', padding: '1rem',
        backgroundColor: '#fef2f2', borderRadius: '12px',
        border: '1px solid #fecaca', color: '#991b1b',
        fontWeight: 600, fontSize: '1rem',
      }}>
        🚫 This order has been cancelled.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
      {statusSteps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep && currentStep < statusSteps.length;
        const lineColor = idx > 0 && idx <= currentStep ? "#10b981" : "#e5e7eb";

        let dotBg = isCompleted ? "#10b981" : "#e5e7eb";
        let dotBorder = "none";
        let icon = null;

        if (isActive) {
          dotBg = "#fff";
          dotBorder = "3px solid #10b981";
        }

        if (isCompleted) {
          icon = (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          );
        }

        return (
          <div key={step} style={{ flex: 1, textAlign: "center", position: "relative" }}>
            {idx > 0 && (
              <div style={{
                position: "absolute", top: "14px", left: "-50%", right: "50%",
                height: "2px", background: lineColor,
              }} />
            )}
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: dotBg, border: dotBorder,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 0.5rem", fontSize: "0.8rem",
            }}>
              {icon || (isActive ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#10b981" stroke="none">
                  <circle cx="12" cy="12" r="6" />
                </svg>
              ) : null)}
            </div>
            <span style={{
              fontSize: "0.8rem",
              color: isCompleted ? "#10b981" : isActive ? "#000" : "#d1d5db",
              fontWeight: isCompleted || isActive ? 600 : 400,
            }}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---------- Shipment Info ----------
const ShipmentInfo = ({ shipment }) => {
  if (!shipment) {
    return (
      <div style={{
        marginTop: "1rem", padding: "0.75rem 1rem",
        background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px",
        fontSize: "0.85rem", color: "#92400e",
        display: "flex", alignItems: "center", gap: "0.5rem",
      }}>
        <span>ℹ️</span>
        <span>Awaiting shipment details from the seller.</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#f9fafb", borderRadius: "8px", fontSize: "0.85rem", color: "#374151" }}>
      <p style={{ fontWeight: 600, margin: "0 0 0.5rem" }}>Shipment</p>
      <p style={{ margin: "0 0 0.25rem" }}>Carrier: {shipment.carrier || "N/A"} | Tracking: {shipment.trackingNumber || "N/A"}</p>
      <p style={{ margin: 0, fontWeight: 600 }}>Status: {shipment.status}</p>
      {shipment.trackingHistory?.length > 0 && (
        <div style={{ marginTop: "0.75rem" }}>
          {shipment.trackingHistory.map((th, i) => (
            <div key={i} style={{ marginBottom: "0.25rem", fontSize: "0.8rem" }}>
              <span style={{ fontWeight: 500 }}>{th.status}</span>
              {th.location && <span> – {th.location}</span>}
              <span style={{ color: "#6b7280", marginLeft: "0.5rem" }}>{new Date(th.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Main Component ----------
const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
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

  const handleCancelClick = () => {
    setIsCancelModalOpen(true);
  };

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

  const getEffectiveStatus = (order) => {
    if (!order || order.orderStatus === 'Cancelled') return 'Cancelled';
    if (['Shipped', 'OutForDelivery', 'Delivered'].includes(order.orderStatus)) {
      return order.orderStatus;
    }
    const sellerStatuses = (order.sellerOrders || []).flatMap(so => {
      const statuses = [so.status];
      if (so.shipment?.status) statuses.push(so.shipment.status);
      return statuses;
    });
    if (sellerStatuses.includes('Delivered')) return 'Delivered';
    if (sellerStatuses.some(s => ['OutForDelivery', 'Dispatched', 'Shipped'].includes(s)))
      return 'OutForDelivery'; // customer‑facing label
    if (sellerStatuses.includes('Processing')) return 'Processing';
    return 'Pending';
  };

  const getActiveIndex = (status) => {
  switch (status) {
    case 'Pending':          return 0;
    case 'Processing':       return 1;
    case 'Shipped':
    case 'Dispatched':       return 2;
    case 'OutForDelivery':   return 3;
    case 'Delivered':        return 4;
    default:                 return 0;
  }
};

  const effectiveStatus = getEffectiveStatus(order);
  const isCancelled = effectiveStatus === 'Cancelled';
  const currentStep = getActiveIndex(effectiveStatus);

  // Determine if cancel should be available
  const canCancel = order && !isCancelled && order.orderStatus === 'Pending'
    && !(order.sellerOrders || []).some(so =>
      ['Processing', 'Shipped', 'Dispatched', 'OutForDelivery', 'Delivered', 'Cancelled'].includes(so.status)
    );

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading order...</div>;
  if (!order) return <div style={{ padding: "2rem", color: "#666" }}>Order not found.</div>;

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      {/* Back link */}
      <Link
        to="/orders"
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.25rem",
          color: "#6b7280", textDecoration: "none", fontSize: "0.9rem",
          marginBottom: "1.5rem", transition: "color 0.2s",
        }}
        onMouseEnter={(e) => e.target.style.color = "#111827"}
        onMouseLeave={(e) => e.target.style.color = "#6b7280"}
      >
        ← Back to orders
      </Link>

      {/* Order header */}
      <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
          Order #{order._id.slice(0, 8).toUpperCase()}
        </h2>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", color: "#4b5563", fontSize: "0.9rem" }}>
          <span>Placed: {new Date(order.createdAt).toLocaleString()}</span>
          <span>Total: <strong style={{ color: "#111827" }}>PKR {order.totalAmount.toLocaleString()}</strong></span>
          {isCancelled && (
            <span style={{ color: '#dc2626', fontWeight: 600 }}>
              (Cancelled)
            </span>
          )}
        </div>
      </div>

      {/* Progress stepper */}
      <StepProgress currentStep={currentStep} isCancelled={isCancelled} />

      {/* Multi‑vendor cards */}
      {order.sellerOrders?.map((so) => {
        // Map seller order status to a friendlier display
        const sellerStatusDisplay = (s) => {
          if (s === 'OutForDelivery' || s === 'Dispatched' || s === 'Shipped') return 'Shipped';
          return s;
        };
        const displayStatus = sellerStatusDisplay(so.status);

        return (
          <div
            key={so._id}
            style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "1.5rem", overflow: "hidden",
            }}
          >
            {/* Card header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6", background: "#f9fafb",
            }}>
              <span style={{ fontWeight: 600, fontSize: "1rem" }}>
                Package from {so.store?.name || "Unknown Store"}
              </span>
              <span style={{
                padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600,
                color: displayStatus === "Delivered" ? "#065f46" : displayStatus === "Cancelled" ? "#991b1b" : displayStatus === "Shipped" ? "#1e40af" : "#92400e",
                background: displayStatus === "Delivered" ? "#d1fae5" : displayStatus === "Cancelled" ? "#fee2e2" : displayStatus === "Shipped" ? "#dbeafe" : "#ffedd5",
              }}>
                {displayStatus}
              </span>
            </div>

            {/* Item table */}
            <div style={{ padding: "1rem 1.25rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>
                    <th style={{ textAlign: "left", padding: "0.5rem 0", fontWeight: 500 }}>Product</th>
                    <th style={{ textAlign: "left", padding: "0.5rem 0", fontWeight: 500 }}>Price</th>
                    <th style={{ textAlign: "left", padding: "0.5rem 0", fontWeight: 500 }}>Qty</th>
                    <th style={{ textAlign: "right", padding: "0.5rem 0", fontWeight: 500 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {so.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f9fafb" }}>
                      <td style={{ padding: "0.5rem 0" }}>{item.productNameSnapshot}</td>
                      <td style={{ padding: "0.5rem 0" }}>PKR {item.unitPriceSnapshot}</td>
                      <td style={{ padding: "0.5rem 0" }}>{item.quantity}</td>
                      <td style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 500 }}>
                        PKR {(item.unitPriceSnapshot * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: "right", fontWeight: 600, marginTop: "0.75rem", fontSize: "0.95rem" }}>
                Subtotal: PKR {so.subTotal?.toLocaleString()}
              </div>
            </div>

            {/* Shipment info */}
            <div style={{ padding: "0 1.25rem 1rem" }}>
              <ShipmentInfo shipment={so.shipment} />
            </div>

            {/* Actions footer */}
            {!isCancelled && (
              <div style={{
                display: "flex", justifyContent: "flex-end", gap: "0.75rem",
                padding: "0.75rem 1.25rem", borderTop: "1px solid #f3f4f6", background: "#f9fafb",
              }}>
                {so.status === "Delivered" && !order.reviewedSellerOrderIds?.has(so._id.toString()) && (
                  <Link
                    to={`/review/new/${so._id}`}
                    style={{
                      padding: "0.4rem 1rem", borderRadius: "6px", border: "1px solid #d1d5db",
                      color: "#111827", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500,
                      background: "#fff", transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#f3f4f6"}
                    onMouseLeave={(e) => e.target.style.background = "#fff"}
                  >
                    Write a Review
                  </Link>
                )}
                {so.status === "Delivered" && order.reviewedSellerOrderIds?.has(so._id.toString()) && (
                  <span style={{ fontSize: "0.8rem", color: "#9ca3af", alignSelf: "center" }}>
                    Review submitted ✓
                  </span>
                )}
                {so.status === "Delivered" && (
                  <Link
                    to={`/returns/new/${so._id}`}
                    style={{
                      padding: "0.4rem 1rem", borderRadius: "6px", border: "1px solid #e5e7eb",
                      color: "#4b5563", textDecoration: "none", fontSize: "0.85rem", fontWeight: 400,
                      background: "#fff", transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#f3f4f6"}
                    onMouseLeave={(e) => e.target.style.background = "#fff"}
                  >
                    Request Return
                  </Link>
                )}
                {canCancel && (
                  <button
                    onClick={handleCancelClick}
                    disabled={cancelling}
                    style={{
                      padding: "0.4rem 1rem", borderRadius: "6px", border: "1px solid #fca5a5",
                      color: "#b91c1c", background: cancelling ? "#fef2f2" : "#fff",
                      fontSize: "0.85rem", fontWeight: 500,
                      cursor: cancelling ? "not-allowed" : "pointer",
                      opacity: cancelling ? 0.6 : 1,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => { if (!cancelling) e.target.style.background = "#fef2f2" }}
                    onMouseLeave={(e) => { if (!cancelling) e.target.style.background = "#fff" }}
                  >
                    {cancelling ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Cancel Confirmation Modal */}
      {isCancelModalOpen && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999,
          }}
          onClick={() => setIsCancelModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#fff", padding: "32px", borderRadius: "16px",
              width: "90%", maxWidth: "400px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              style={{ width: 48, height: 48, color: "#ef4444", marginBottom: 16 }}
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
              Cancel this order?
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: 0 }}>
              Are you sure you want to cancel this order? This action cannot be undone and the seller will be notified.
            </p>
            <div style={{ display: "flex", gap: 12, width: "100%", marginTop: 24 }}>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", color: "#374151", cursor: "pointer", fontWeight: 600 }}
              >
                Nevermind
              </button>
              <button
                onClick={handleConfirmCancel}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 }}
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
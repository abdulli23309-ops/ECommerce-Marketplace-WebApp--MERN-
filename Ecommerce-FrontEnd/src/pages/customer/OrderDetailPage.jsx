import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchOrderById, cancelOrder } from "../../services/orderService";
import { fetchMyReviews } from "../../services/reviewService";

const statusSteps = ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"];

const StepProgress = ({ currentStep, isCancelled }) => {
  if (isCancelled) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '2rem', padding: '1rem',
        backgroundColor: 'var(--danger-bg)', borderRadius: '12px',
        border: '1px solid var(--danger)', color: 'var(--danger-text)',
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
        const lineColor = idx > 0 && idx <= currentStep ? "var(--success)" : "var(--border)";

        let dotBg = isCompleted ? "var(--success)" : "var(--border)";
        let dotBorder = "none";
        let icon = null;

        if (isActive) {
          dotBg = "var(--surface)";
          dotBorder = "3px solid var(--success)";
        }

        if (isCompleted) {
          icon = (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success-text)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--success)" stroke="none">
                  <circle cx="12" cy="12" r="6" />
                </svg>
              ) : null)}
            </div>
            <span style={{
              fontSize: "0.8rem",
              color: isCompleted ? "var(--success)" : isActive ? "var(--text-primary)" : "var(--text-muted)",
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

const ShipmentInfo = ({ shipment }) => {
  if (!shipment) {
    return (
      <div style={{
        marginTop: "1rem", padding: "0.75rem 1rem",
        background: "var(--warning-bg)", border: "1px solid var(--warning)", borderRadius: "8px",
        fontSize: "0.85rem", color: "var(--warning-text)",
        display: "flex", alignItems: "center", gap: "0.5rem",
      }}>
        <span>ℹ️</span>
        <span>Awaiting shipment details from the seller.</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "var(--bg-secondary)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--text-primary)" }}>
      <p style={{ fontWeight: 600, margin: "0 0 0.5rem" }}>Shipment</p>
      <p style={{ margin: "0 0 0.25rem" }}>Carrier: {shipment.carrier || "N/A"} | Tracking: {shipment.trackingNumber || "N/A"}</p>
      <p style={{ margin: 0, fontWeight: 600 }}>Status: {shipment.status}</p>
      {shipment.trackingHistory?.length > 0 && (
        <div style={{ marginTop: "0.75rem" }}>
          {shipment.trackingHistory.map((th, i) => (
            <div key={i} style={{ marginBottom: "0.25rem", fontSize: "0.8rem" }}>
              <span style={{ fontWeight: 500 }}>{th.status}</span>
              {th.note && <span> – {th.note}</span>}
              <span style={{ color: "var(--text-secondary)", marginLeft: "0.5rem" }}>{new Date(th.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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

  const getEffectiveStatus = (order) => {
    if (!order || order.orderStatus === 'Cancelled') return 'Cancelled';
    if (['Shipped', 'OutForDelivery', 'Delivered'].includes(order.orderStatus)) return order.orderStatus;
    const sellerStatuses = (order.sellerOrders || []).flatMap(so => {
      const statuses = [so.status];
      if (so.shipment?.status) statuses.push(so.shipment.status);
      return statuses;
    });
    if (sellerStatuses.includes('Delivered')) return 'Delivered';
    if (sellerStatuses.some(s => ['OutForDelivery', 'Dispatched', 'Shipped'].includes(s))) return 'OutForDelivery';
    if (sellerStatuses.includes('Processing')) return 'Processing';
    return 'Pending';
  };

  const getActiveIndex = (status) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Processing': return 1;
      case 'Shipped':
      case 'Dispatched': return 2;
      case 'OutForDelivery': return 3;
      case 'Delivered': return 4;
      default: return 0;
    }
  };

  const effectiveStatus = getEffectiveStatus(order);
  const isCancelled = effectiveStatus === 'Cancelled';
  const currentStep = getActiveIndex(effectiveStatus);

  const isStripeRefundCancellation =
    order?.orderStatus === 'Processing' &&
    order.payment?.method === 'Stripe' &&
    order.payment?.status === 'Completed';

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

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading order...</div>;
  if (!order) return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Order not found.</div>;

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
      <Link
        to="/orders"
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.25rem",
          color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem",
          marginBottom: "1.5rem", transition: "color 0.2s",
        }}
        onMouseEnter={(e) => e.target.style.color = "var(--text-primary)"}
        onMouseLeave={(e) => e.target.style.color = "var(--text-secondary)"}
      >
        ← Back to orders
      </Link>

      <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
          Order #{order._id.slice(0, 8).toUpperCase()}
        </h2>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          <span>Placed: {new Date(order.createdAt).toLocaleString()}</span>
          <span>Total: <strong style={{ color: "var(--text-primary)" }}>PKR {order.totalAmount.toLocaleString()}</strong></span>
          {isCancelled && (
            <span style={{ color: "var(--danger)", fontWeight: 600 }}>(Cancelled)</span>
          )}
        </div>
      </div>

      <StepProgress currentStep={currentStep} isCancelled={isCancelled} />

      {order.sellerOrders?.map((so) => {
        const sellerStatusDisplay = (s) => {
          if (s === 'OutForDelivery' || s === 'Dispatched' || s === 'Shipped') return 'Shipped';
          return s;
        };
        const displayStatus = sellerStatusDisplay(so.status);

        return (
          <div
            key={so._id}
            style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
              boxShadow: "0 1px 3px var(--shadow)", marginBottom: "1.5rem", overflow: "hidden",
            }}
          >
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)",
            }}>
              <span style={{ fontWeight: 600, fontSize: "1rem" }}>
                Package from {so.store?.name || "Unknown Store"}
              </span>
              <span style={{
                padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600,
                color: displayStatus === "Delivered" ? "var(--success-text)" : displayStatus === "Cancelled" ? "var(--danger-text)" : displayStatus === "Shipped" ? "var(--info-text)" : "var(--warning-text)",
                background: displayStatus === "Delivered" ? "var(--success-bg)" : displayStatus === "Cancelled" ? "var(--danger-bg)" : displayStatus === "Shipped" ? "var(--info-bg)" : "var(--warning-bg)",
              }}>
                {displayStatus}
              </span>
            </div>

            <div style={{ padding: "1rem 1.25rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    <th style={{ textAlign: "left", padding: "0.5rem 0", fontWeight: 500 }}>Product</th>
                    <th style={{ textAlign: "left", padding: "0.5rem 0", fontWeight: 500 }}>Price</th>
                    <th style={{ textAlign: "left", padding: "0.5rem 0", fontWeight: 500 }}>Qty</th>
                    <th style={{ textAlign: "right", padding: "0.5rem 0", fontWeight: 500 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {so.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
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

            <div style={{ padding: "0 1.25rem 1rem" }}>
              <ShipmentInfo shipment={so.shipment} />
            </div>

            {!isCancelled && (
              <div style={{
                display: "flex", justifyContent: "flex-end", gap: "0.75rem",
                padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)",
              }}>
                {so.status === "Delivered" && !order.reviewedSellerOrderIds?.has(so._id.toString()) && (
                  <Link
                    to={`/review/new/${so._id}`}
                    style={{
                      padding: "0.4rem 1rem", borderRadius: "6px", border: "1px solid var(--border)",
                      color: "var(--text-primary)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500,
                      background: "var(--surface)", transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "var(--surface-hover)"}
                    onMouseLeave={(e) => e.target.style.background = "var(--surface)"}
                  >
                    Write a Review
                  </Link>
                )}
                {so.status === "Delivered" && order.reviewedSellerOrderIds?.has(so._id.toString()) && (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center" }}>
                    Review submitted ✓
                  </span>
                )}
                {so.status === "Delivered" && (
                  <Link
                    to={`/returns/new/${so._id}`}
                    style={{
                      padding: "0.4rem 1rem", borderRadius: "6px", border: "1px solid var(--border)",
                      color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 400,
                      background: "var(--surface)", transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "var(--surface-hover)"}
                    onMouseLeave={(e) => e.target.style.background = "var(--surface)"}
                  >
                    Request Return
                  </Link>
                )}
                {canCancel && (
                  <button
                    onClick={handleCancelClick}
                    disabled={cancelling}
                    style={{
                      padding: "0.4rem 1rem", borderRadius: "6px", border: "1px solid var(--danger)",
                      color: "var(--danger-text)", background: cancelling ? "var(--danger-bg)" : "var(--surface)",
                      fontSize: "0.85rem", fontWeight: 500,
                      cursor: cancelling ? "not-allowed" : "pointer",
                      opacity: cancelling ? 0.6 : 1,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => { if (!cancelling) e.target.style.background = "var(--danger-bg)" }}
                    onMouseLeave={(e) => { if (!cancelling) e.target.style.background = "var(--surface)" }}
                  >
                    {cancelling ? "Cancelling..." : isStripeRefundCancellation ? "Cancel & Refund" : "Cancel Order"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

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
              backgroundColor: "var(--surface)", padding: "32px", borderRadius: "16px",
              width: "90%", maxWidth: "400px",
              boxShadow: "0 20px 25px -5px var(--shadow), 0 10px 10px -5px var(--shadow)",
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg style={{ width: 48, height: 48, color: "var(--danger)", marginBottom: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>Cancel this order?</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>
              {isStripeRefundCancellation
                ? "Are you sure you want to cancel this order? Your payment will be automatically refunded to your original payment method. This action cannot be undone."
                : "Are you sure you want to cancel this order? This action cannot be undone and the seller will be notified."}
            </p>
            <div style={{ display: "flex", gap: 12, width: "100%", marginTop: 24 }}>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", cursor: "pointer", fontWeight: 600 }}
              >
                Nevermind
              </button>
              <button
                onClick={handleConfirmCancel}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "var(--danger)", color: "#fff", cursor: "pointer", fontWeight: 600 }}
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
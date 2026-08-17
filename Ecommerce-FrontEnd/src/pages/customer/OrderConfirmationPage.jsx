import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get("payment_intent");

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    let mounted = true;
    let pollTimer = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 10; // 10 × 2s = 20s timeout

    const fetchDetails = async () => {
      try {
        if (mounted) setLoading(true);

        // Fetch order once
        if (!order) {
          const orderRes = await axiosInstance.get(`/orders/${orderId}`);
          if (mounted) setOrder(orderRes.data.data || orderRes.data);
        }

        const paymentRes = await axiosInstance.get(`/payments/order/${orderId}`);
        const payData = paymentRes.data.data || paymentRes.data;
        const currentPayment = Array.isArray(payData) ? payData[0] : payData;
        if (mounted) setPayment(currentPayment);

        // If Stripe and status is still Pending, keep polling
        if (
          currentPayment?.method === "Stripe" &&
          currentPayment?.status === "Pending" &&
          attempts < MAX_ATTEMPTS
        ) {
          attempts += 1;
          if (mounted) setPolling(true);
          pollTimer = setTimeout(fetchDetails, 2000);
          return;
        }

        if (mounted) {
          setPolling(false);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load confirmation", err);
        if (mounted) {
          setPolling(false);
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      mounted = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [orderId]);

  if (loading || polling) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            border: "3px solid var(--border)",
            borderTopColor: "#2563eb",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p>Processing payment...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!order || !payment) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        Order not found.
      </div>
    );
  }

  // ----- Determine visual state -----
  const isStripe = payment.method === "Stripe";
  const isPaid = payment.status === "Completed";
  const isFailed = isStripe && payment.status === "Failed";
  const isRefunded = payment.status === "Refunded";
  const isCOD = payment.method === "CashOnDelivery";

  let icon = "📦";
  let title = "Order Placed";
  let subtitle = "Your order has been placed successfully.";
  let statusLabel = "Pending";
  let statusColor = "#92400e";

  if (isStripe && isPaid) {
    icon = "✅";
    title = "Payment Successful!";
    subtitle = "Your payment has been processed.";
    statusLabel = "Paid";
    statusColor = "#065f46";
  } else if (isFailed) {
    icon = "❌";
    title = "Payment Failed";
    subtitle = "We couldn't process your payment. Please try again.";
    statusLabel = "Failed";
    statusColor = "#b91c1c";
  } else if (isRefunded) {
    icon = "↩️";
    title = "Payment Refunded";
    subtitle = "This payment has been refunded.";
    statusLabel = "Refunded";
    statusColor = "#4338ca";
  } else if (isCOD) {
    icon = "📦";
    title = "Order Placed!";
    subtitle = "Your order has been placed successfully and will be delivered soon.";
    statusLabel = "Pending";
    statusColor = "#92400e";
  } else if (isStripe && payment.status === "Pending") {
    icon = "⏳";
    title = "Payment Pending";
    subtitle = "Your payment is still processing. Please wait.";
    statusLabel = "Pending";
    statusColor = "#92400e";
  }

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "2rem auto",
        padding: "2rem",
        background: "var(--surface)",
        borderRadius: "16px",
        boxShadow: "0 4px 24px var(--shadow)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{icon}</div>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{title}</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>{subtitle}</p>
      </div>

      {/* Details */}
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
        <div style={rowStyle}>
          <span style={labelStyle}>Order Number</span>
          <span style={valueStyle}>#{order._id.slice(-8).toUpperCase()}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Date</span>
          <span style={valueStyle}>{new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Total Amount</span>
          <span style={valueStyle}>PKR {payment.amount.toLocaleString()}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Payment Method</span>
          <span style={valueStyle}>
            {isCOD ? "Cash on Delivery" : "Credit/Debit Card"}
          </span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Status</span>
          <span style={{ ...valueStyle, fontWeight: 700, color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        {isStripe && isPaid && payment.cardLast4 && (
          <>
            <div style={rowStyle}>
              <span style={labelStyle}>Card</span>
              <span style={valueStyle}>
                {payment.cardBrand?.toUpperCase() || "Card"} **** {payment.cardLast4}
              </span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Expiry</span>
              <span style={valueStyle}>
                {payment.cardExpMonth}/{payment.cardExpYear}
              </span>
            </div>
          </>
        )}

        {paymentIntentId && (
          <div style={rowStyle}>
            <span style={labelStyle}>Transaction ID</span>
            <span style={{ ...valueStyle, fontSize: "0.8rem", wordBreak: "break-all" }}>
              {paymentIntentId}
            </span>
          </div>
        )}
      </div>

      {/* Action */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link
          to="/orders"
          style={{ color: "var(--info)", textDecoration: "none", fontWeight: 500 }}
        >
          View My Orders
        </Link>
        {isFailed && (
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "0.5rem 0",
  borderBottom: "1px solid #f3f4f6",
};

const labelStyle = { color: "var(--text-secondary)", fontSize: "0.9rem" };
const valueStyle = { fontWeight: 500, color: "var(--text-primary)", textAlign: "right" };

export default OrderConfirmationPage;

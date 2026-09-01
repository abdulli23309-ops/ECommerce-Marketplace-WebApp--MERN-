import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { formatPKR } from "../../utils/currency";
import { TableSkeleton } from "../../components/common/Skeleton";

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [orderRes, paymentRes] = await Promise.all([
          axiosInstance.get(`/orders/${orderId}`),
          axiosInstance.get(`/payments/order/${orderId}`),
        ]);

        setOrder(orderRes.data?.data || orderRes.data || null);
        setPayment(paymentRes.data?.data || paymentRes.data || null);
      } catch (err) {
        console.error("Failed to load confirmation data", err);
        setError("Could not load order confirmation details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [orderId]);

  // Silent polling so prepaid payments (Stripe / wallet) update without a manual
  // refresh. The Stripe webhook may confirm the payment a moment after the user
  // is redirected here; poll every 2s until the status reaches a terminal state.
  // No refresh indicator is shown to the user. COD (CashOnDelivery) is never
  // polled because it legitimately stays Pending until the courier collects cash.
  useEffect(() => {
    if (!orderId || !payment) return;

    const { method, status } = payment;

    // Only poll prepaid methods whose status can become Completed shortly.
    const isPrepaid =
      method === "Stripe" || method === "EasyPaisa" || method === "JazzCash";
    const isTerminal = status === "Completed" || status === "Failed";

    if (!isPrepaid || isTerminal) return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 30; // 30 × 2000ms = 60s silent safety cap

    const attempt = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const paymentRes = await axiosInstance.get(`/payments/order/${orderId}`);
        const nextPayment = paymentRes.data?.data || paymentRes.data || null;
        if (cancelled) return;
        setPayment(nextPayment);
        const nextStatus = nextPayment?.status;
        if (
          nextStatus === "Completed" ||
          nextStatus === "Failed" ||
          attempts >= MAX_ATTEMPTS
        ) {
          return; // terminal status reached → stop polling
        }
      } catch {
        if (cancelled || attempts >= MAX_ATTEMPTS) return; // stop on repeated failures
      }
      timer = setTimeout(attempt, 2000);
    };

    let timer = setTimeout(attempt, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // React on method/status changes so the effect self-terminates once terminal.
  }, [orderId, payment?.method, payment?.status]);

  if (loading) {
    return (
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem" }}>
        <TableSkeleton rows={6} header={false} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
        <h2>Something went wrong</h2>
        <p>{error || "Order not found."}</p>
        <Link to="/orders">View My Orders</Link>
      </div>
    );
  }

  // Cash on Delivery is unpaid until the courier collects cash on delivery, so
  // it must never render as "Payment Successful". Show a neutral "Order Placed"
  // state with pending/warning styling regardless of the stored payment status.
  const isCOD = payment?.method === "CashOnDelivery";
  const paid = !isCOD && payment?.status === "Completed";
  const failed = !isCOD && payment?.status === "Failed";

  let statusText;
  let statusStyle;
  let statusIcon;

  if (isCOD) {
    statusText = "Order Placed - Payment on Delivery";
    statusStyle = { backgroundColor: "var(--warning-bg)", color: "var(--warning-text)" };
    statusIcon = "📦";
  } else if (paid) {
    statusText = "Payment Successful!";
    statusStyle = { backgroundColor: "var(--success-bg)", color: "var(--success-text)" };
    statusIcon = "✅";
  } else if (failed) {
    statusText = "Payment Failed";
    statusStyle = { backgroundColor: "var(--danger-bg)", color: "var(--danger-text)" };
    statusIcon = "❌";
  } else {
    statusText = "Payment Pending";
    statusStyle = { backgroundColor: "var(--warning-bg)", color: "var(--warning-text)" };
    statusIcon = "⏳";
  }

  // ----- Safe order values -----
  const subtotal = Number(order.subtotal ?? 0);
  const discountAmount = Number(order.discountAmount ?? 0);
  const deliveryCharges = Number(order.deliveryCharges ?? 0);
  const freeDeliveryDiscount = Number(order.freeDeliveryDiscount ?? 0);
  const totalAmount = Number(order.totalAmount ?? 0);

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
      <div
        style={{
          ...statusStyle,
          padding: "1.25rem 1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          textAlign: "center",
          fontWeight: 700,
          fontSize: "1.25rem",
        }}
      >
        {statusIcon} {statusText}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "2rem", boxShadow: "0 1px 3px var(--shadow)" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          Order Summary
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.95rem" }}>
          {/* Order metadata */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Order Number</span>
            <strong>#{order._id?.slice(-8).toUpperCase()}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Date</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>

          {/* ----- BREAKDOWN ROWS ----- */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
            <span>PKR {formatPKR(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Discount</span>
              <span>-PKR {formatPKR(discountAmount)}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Delivery Charges</span>
            <span>PKR {formatPKR(deliveryCharges)}</span>
          </div>

          {freeDeliveryDiscount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Free Delivery Discount</span>
              <span>-PKR {formatPKR(freeDeliveryDiscount)}</span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid var(--border)",
              paddingTop: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <strong>Final Total</strong>
            <strong>PKR {formatPKR(totalAmount)}</strong>
          </div>

          {/* Payment details */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Payment Method</span>
            <span>
              {payment?.method === "CashOnDelivery"
                ? "Cash on Delivery"
                : payment?.method === "Stripe"
                  ? "Credit/Debit Card"
                  : payment?.method === "EasyPaisa"
                    ? "EasyPaisa"
                    : payment?.method === "JazzCash"
                      ? "JazzCash"
                      : "N/A"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Status</span>
            <span>{payment?.status || order.orderStatus}</span>
          </div>

          {payment?.transactionId && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Transaction ID</span>
              <span>{payment.transactionId}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link
          to="/orders"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            background: "var(--primary)",
            color: "var(--primary-contrast)",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: 600,
          }}
        >
          View My Orders
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
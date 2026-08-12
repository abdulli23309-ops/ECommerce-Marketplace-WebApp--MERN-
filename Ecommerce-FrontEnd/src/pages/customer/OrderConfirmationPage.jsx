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

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const orderRes = await axiosInstance.get(`/orders/${orderId}`);
        setOrder(orderRes.data.data || orderRes.data);

        const paymentRes = await axiosInstance.get(`/payments/order/${orderId}`);
        setPayment(paymentRes.data.data || paymentRes.data);
      } catch (err) {
        console.error("Failed to load confirmation", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [orderId]);

  if (loading) return <div style={{ textAlign: "center", padding: "2rem" }}>Loading confirmation...</div>;
  if (!order || !payment) return <div style={{ textAlign: "center", padding: "2rem" }}>Order not found.</div>;

  const isStripe = payment.method === "Stripe";
  const isCompleted = payment.status === "Completed";

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "2rem", background: "#fff", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", fontFamily: "Inter, sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{isCompleted ? "✅" : "⏳"}</div>
        <h2 style={{ margin: 0 }}>{isCompleted ? "Payment Successful!" : "Order Placed"}</h2>
        <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
          {isStripe ? "Your payment has been processed." : "Your order has been placed successfully."}
        </p>
      </div>

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
            {payment.method === "CashOnDelivery" ? "Cash on Delivery" : "Credit/Debit Card"}
          </span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Status</span>
          <span style={{ ...valueStyle, fontWeight: 700, color: isCompleted ? "#065f46" : "#92400e" }}>
            {isCompleted ? "Paid" : "Pending"}
          </span>
        </div>

        {isStripe && payment.cardLast4 && (
          <>
            <div style={rowStyle}>
              <span style={labelStyle}>Card</span>
              <span style={valueStyle}>
                {payment.cardBrand?.toUpperCase() || "Card"} **** {payment.cardLast4}
              </span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Expiry</span>
              <span style={valueStyle}>{payment.cardExpMonth}/{payment.cardExpYear}</span>
            </div>
            {paymentIntentId && (
              <div style={rowStyle}>
                <span style={labelStyle}>Transaction ID</span>
                <span style={{ ...valueStyle, fontSize: "0.8rem", wordBreak: "break-all" }}>{paymentIntentId}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link to="/orders" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
          View My Orders
        </Link>
      </div>
    </div>
  );
};

const rowStyle = { display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f3f4f6" };
const labelStyle = { color: "#6b7280", fontSize: "0.9rem" };
const valueStyle = { fontWeight: 500, color: "#111827", textAlign: "right" };

export default OrderConfirmationPage;
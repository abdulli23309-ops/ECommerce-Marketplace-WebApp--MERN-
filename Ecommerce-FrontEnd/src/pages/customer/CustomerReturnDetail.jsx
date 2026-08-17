import { useState, useEffect } from "react";
import { getImageUrl } from "../../utils/imageHelper";
import axiosInstance from "../../services/axiosInstance";

const statusLabels = {
  PENDING_ADMIN_REVIEW: "Request Submitted",
  REJECTED_BY_ADMIN: "Request Rejected",
  PENDING_SELLER_REVIEW: "Approved",
  APPROVED_PENDING_SHIPMENT: "Approved",
  REJECTED_BY_SELLER: "Declined",
  ITEM_IN_TRANSIT: "Item Shipped",
  SELLER_RECEIVED: "Received by Seller",
  INSPECTED_AND_REFUNDED: "Refund Completed",
};

const stepOrder = ["Request Submitted", "Approved", "Item Shipped", "Refund Completed"];

const CustomerReturnDetail = ({ returnReq, onClose, onUpdate }) => {
  const [tracking, setTracking] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refundAmount, setRefundAmount] = useState(null);

  useEffect(() => {
    if (returnReq.status === "INSPECTED_AND_REFUNDED") {
      axiosInstance.get(`/returns/${returnReq._id}/refund`)
        .then(res => { const refund = res.data?.data || res.data; if (refund?.amount) setRefundAmount(refund.amount); })
        .catch(console.error);
    }
  }, [returnReq]);

  const handleShip = async () => {
    if (!tracking.trim()) return;
    setSubmitting(true);
    try {
      await axiosInstance.put(`/returns/${returnReq._id}/tracking`, { trackingNumber: tracking });
      onUpdate();
      onClose();
    } catch (err) { console.error("Failed to update tracking", err); alert("Could not update tracking."); } finally { setSubmitting(false); }
  };

  const currentStatusLabel = statusLabels[returnReq.status] || returnReq.status;
  let activeStepIndex;
  if (returnReq.status === "INSPECTED_AND_REFUNDED") activeStepIndex = stepOrder.length;
  else if (returnReq.status === "SELLER_RECEIVED") activeStepIndex = 3;
  else if (returnReq.status === "REJECTED_BY_ADMIN" || returnReq.status === "REJECTED_BY_SELLER") activeStepIndex = stepOrder.indexOf(currentStatusLabel);
  else activeStepIndex = stepOrder.indexOf(currentStatusLabel);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 999 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "var(--surface)", borderRadius: "16px", boxShadow: "0 20px 60px var(--shadow)", zIndex: 1000, width: "90%", maxWidth: "600px", maxHeight: "85vh", overflowY: "auto", padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Return #{returnReq.returnNumber || returnReq._id.slice(-8)}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem", position: "relative" }}>
          {stepOrder.map((step, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isActive = idx === activeStepIndex && !isCompleted;
            const isFailed = (returnReq.status === "REJECTED_BY_ADMIN" || returnReq.status === "REJECTED_BY_SELLER") && idx === 1;

            return (
              <div key={step} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                {idx > 0 && <div style={{ position: "absolute", top: "12px", left: "-50%", right: "50%", height: "2px", background: isCompleted || isActive ? "var(--success)" : "var(--border)", zIndex: 0 }} />}
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: isCompleted ? "var(--success)" : isActive ? "var(--surface)" : "var(--border)", border: isActive ? "3px solid var(--success)" : "none", margin: "0 auto 0.5rem", position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-contrast)", fontSize: "12px", fontWeight: 700 }}>
                  {isCompleted && "✓"}{isFailed && "✕"}
                </div>
                <div style={{ fontSize: "0.7rem", color: isCompleted ? "var(--success)" : isActive ? "var(--text-primary)" : "var(--text-muted)", fontWeight: isCompleted || isActive ? 600 : 400 }}>{step}</div>
              </div>
            );
          })}
        </div>

        <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "var(--surface-hover)" }}>
              {returnReq.product?.images?.[0] ? <img src={getImageUrl(returnReq.product.images[0])} alt={returnReq.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}><svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{returnReq.product?.name || "Product"}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "2px" }}>{returnReq.reason}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>{returnReq.description}</div>
              {returnReq.returnTrackingNumber && <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}><strong>Tracking:</strong> {returnReq.returnTrackingNumber}</div>}
              {refundAmount && <div style={{ color: "var(--success-text)", fontWeight: 600, fontSize: "0.9rem", marginTop: "8px" }}>Refund Amount: PKR {refundAmount.toLocaleString()}</div>}
            </div>
          </div>
        </div>

        {returnReq.images?.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.9rem" }}>Evidence Photos</h4>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {returnReq.images.map((img, i) => <img key={i} src={getImageUrl(img)} alt={`Evidence ${i+1}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)", transition: "transform 0.2s", cursor: "zoom-in" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")} />)}
            </div>
          </div>
        )}

        {returnReq.status === "APPROVED_PENDING_SHIPMENT" && (
          <div style={{ background: "var(--warning-bg)", border: "1px solid var(--warning)", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <h4 style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--warning-text)" }}>📦 Action Required: Ship the Item</h4>
            <p style={{ fontSize: "0.9rem", color: "var(--warning-text)", marginBottom: "1rem" }}>Please pack the item securely and ship it to the seller. Once shipped, enter the tracking number below.</p>
            <input type="text" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking ID" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "0.9rem", marginBottom: "0.75rem", boxSizing: "border-box" }} />
            <button onClick={handleShip} disabled={submitting || !tracking.trim()} style={{ width: "100%", padding: "0.6rem", background: "var(--primary)", color: "var(--primary-contrast)", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", opacity: submitting || !tracking.trim() ? 0.7 : 1 }}>{submitting ? "Submitting..." : "Submit Tracking Info"}</button>
          </div>
        )}

        {returnReq.status === "INSPECTED_AND_REFUNDED" && (
          <div style={{ background: "var(--success-bg)", border: "1px solid var(--success)", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", textAlign: "center", color: "var(--success-text)", fontWeight: 600 }}>🎉 Refund Completed! The amount has been sent back to your original payment method.</div>
        )}

        <button onClick={onClose} style={{ width: "100%", padding: "0.6rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-secondary)", fontWeight: 500, cursor: "pointer" }}>Close</button>
      </div>
    </>
  );
};

export default CustomerReturnDetail;
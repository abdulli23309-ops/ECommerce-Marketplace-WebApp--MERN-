import { useState, useEffect } from "react";
import { getReturns, createRefund } from "../../services/adminService";
import PermissionGate from "../../components/common/PermissionGate";

const RefundManagementPage = () => {
  const [approvedReturns, setApprovedReturns] = useState([]);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const returns = await getReturns();
        setApprovedReturns(returns.filter((r) => r.status === "Approved"));
      } catch (err) {
        console.error("Failed to load returns", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRefund = async (returnRequestId) => {
    setSubmitting(true);
    setMessage(null);
    try {
      await createRefund(returnRequestId);
      setMessage({ type: "success", text: "Refund created successfully!" });
      setApprovedReturns((prev) => prev.filter((r) => r.id !== returnRequestId));
    } catch (err) {
      setMessage({ type: "error", text: "Failed to create refund." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading...</div>;

  return (
    <div>
      <h2 className="section-title">Refund Management</h2>

      <h3 style={{ fontWeight: 600, marginBottom: "1rem", color: "#000" }}>Approved Returns (Pending Refund)</h3>
      {approvedReturns.length === 0 ? (
        <p className="empty-state">No approved returns waiting for refund.</p>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {approvedReturns.map((ret) => (
              <tr key={ret.id}>
                <td>{ret.productName}</td>
                <td>{ret.customerEmail}</td>
                <td>{ret.reason}</td>
                <td>
                  <PermissionGate permission="Orders.Refund">
  <button className="btn-primary" onClick={handleRefund} disabled={submitting}>
    {submitting ? "Processing..." : "Refund"}
  </button>
</PermissionGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {message && (
        <p style={{ color: message.type === "success" ? "#000" : "#d11a2a", marginTop: "1rem", fontWeight: 500 }}>
          {message.text}
        </p>
      )}
    </div>
  );
};

export default RefundManagementPage;
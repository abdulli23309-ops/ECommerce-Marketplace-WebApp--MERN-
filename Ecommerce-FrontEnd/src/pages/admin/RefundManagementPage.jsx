import { useState, useEffect } from "react";
import { getReturns, createRefund } from "../../services/adminService";
import PermissionGate from "../../components/common/PermissionGate";

const RefundManagementPage = () => {
  const [approvedReturns, setApprovedReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReturns();                     // returns { items, total, ... }
      const allReturns = res.items || [];
      const refundable = allReturns.filter((r) => r.status === "Approved");
      setApprovedReturns(refundable);
    } catch (err) {
      console.error("Failed to load returns", err);
      setError("Could not load returns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
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

  return (
    <div>
      <h2 className="section-title">Refund Management</h2>
      <h3 style={{ fontWeight: 600, marginBottom: "1rem", color: "#000" }}>
        Approved Returns (Pending Refund)
      </h3>

      {loading ? (
        <p style={{ color: "#666" }}>Loading...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : approvedReturns.length === 0 ? (
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
                    <button
                      className="btn-primary"
                      onClick={() => handleRefund(ret.id)}
                      disabled={submitting}
                    >
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
        <p style={{
          color: message.type === "success" ? "#000" : "#d11a2a",
          marginTop: "1rem",
          fontWeight: 500,
        }}>
          {message.text}
        </p>
      )}
    </div>
  );
};

export default RefundManagementPage;
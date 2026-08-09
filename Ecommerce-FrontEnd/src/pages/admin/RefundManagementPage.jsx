import { useState, useEffect } from "react";
import { getReturns, createRefund } from "../../services/adminService";

const RefundManagementPage = () => {
  const [approvedReturns, setApprovedReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await getReturns();
      const allReturns = res.items || [];
      setApprovedReturns(allReturns.filter((r) => r.status === "Approved"));
    } catch (err) {
      console.error("Failed to load returns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReturns(); }, []);

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
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>Refund Management</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>Approved returns pending refund</p>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : approvedReturns.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No approved returns waiting for refund.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Reason</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvedReturns.map((ret) => (
                  <tr key={ret.id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", fontWeight: 500, color: "#111827" }}>{ret.productName}</td>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "#4b5563" }}>{ret.customerEmail}</td>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "#4b5563" }}>{ret.reason}</td>
                    <td style={{ padding: "0.75rem 1.25rem", textAlign: "center" }}>
                      <button
                        onClick={() => handleRefund(ret.id)}
                        disabled={submitting}
                        style={{
                          padding: "0.4rem 1rem",
                          borderRadius: "6px",
                          border: "none",
                          background: "#111827",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => e.target.style.background = "#1f2937"}
                        onMouseLeave={(e) => e.target.style.background = "#111827"}
                      >
                        {submitting ? "Processing..." : "Refund"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {message && (
            <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid #f3f4f6", color: message.type === "success" ? "#065f46" : "#991b1b", fontWeight: 500, fontSize: "0.9rem" }}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundManagementPage;
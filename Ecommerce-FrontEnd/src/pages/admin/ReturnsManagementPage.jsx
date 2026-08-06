import { useState, useEffect } from "react";
import { getReturns, approveReturn, rejectReturn } from "../../services/adminService";

const ReturnsManagementPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await getReturns();
      setReturns(data || []);
    } catch (err) {
      console.error("Failed to load returns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReturns(); }, []);

  const handleAction = async (returnId, action) => {
    try {
      if (action === "approve") await approveReturn(returnId);
      else await rejectReturn(returnId);
      setReturns((prev) =>
        prev.map((r) =>
          r.id === returnId ? { ...r, status: action === "approve" ? "Approved" : "Rejected" } : r
        )
      );
    } catch (err) {
      console.error(`Failed to ${action} return`, err);
    }
  };

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading returns...</div>;

  return (
    <div>
      <h2 className="section-title">Returns Management</h2>

      {returns.length === 0 ? (
        <div className="empty-state">No return requests.</div>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Product</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((ret) => (
              <tr key={ret.id}>
                <td>{ret.customerEmail}</td>
                <td>{ret.productName}</td>
                <td style={{ maxWidth: "300px" }}>{ret.reason}</td>
                <td>
                  <span style={{ fontWeight: 600, color: ret.status === "Approved" ? "#000" : "#666" }}>
                    {ret.status}
                  </span>
                </td>
                <td>
                  {ret.status === "Requested" && (
                    <>
                      <button className="btn-edit" onClick={() => handleAction(ret.id, "approve")}>Approve</button>
                      <button className="btn-delete" onClick={() => handleAction(ret.id, "reject")}>Reject</button>
                    </>
                  )}
                  {ret.status !== "Requested" && <span style={{ color: "#999" }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReturnsManagementPage;
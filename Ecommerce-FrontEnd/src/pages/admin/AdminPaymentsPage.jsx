import { useState, useEffect } from "react";
import { getPayments } from "../../services/adminService";

const statusBadgeStyle = (status) => {
  const base = {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
  };
  switch (status) {
    case "Completed":
      return { ...base, backgroundColor: "#dcfce7", color: "#166534" };
    case "Pending":
      return { ...base, backgroundColor: "#fef3c7", color: "#92400e" };
    case "Failed":
      return { ...base, backgroundColor: "#fee2e2", color: "#991b1b" };
    default:
      return { ...base, backgroundColor: "#f3f4f6", color: "#1f2937" };
  }
};

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await getPayments({ page, pageSize: 10, search, status: statusFilter, method: methodFilter });
      setPayments(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [page, search, statusFilter, methodFilter]);

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>Payments</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>View all payment transactions</p>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <input className="form-input" placeholder="Search by payment ID..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: "200px", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none" }} />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none", background: "#fff" }}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
          <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none", background: "#fff" }}>
            <option value="">All Methods</option>
            <option value="Dummy">Dummy</option>
            <option value="CashOnDelivery">Cash on Delivery</option>
          </select>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : payments.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No payments found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment ID</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order ID</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Method</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "right", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.paymentId} style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", fontWeight: 500, color: "#111827" }}>{p.paymentId.slice(0, 8).toUpperCase()}</td>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "#4b5563" }}>{p.orderId?.slice(0, 8).toUpperCase() || "N/A"}</td>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "#4b5563" }}>{p.method}</td>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", fontWeight: 600, color: "#111827", textAlign: "right" }}>PKR {p.amount?.toLocaleString()}</td>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <span style={statusBadgeStyle(p.status)}>{p.status}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "#4b5563" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "#6b7280" }}>Page {page} of {totalPages}</span>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
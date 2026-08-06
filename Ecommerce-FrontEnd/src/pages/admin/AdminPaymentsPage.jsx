import { useState, useEffect } from "react";
import { getPayments } from "../../services/adminService";

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
      const data = await getPayments();
      setPayments(data || []);
      setTotalPages(1);
    } catch (err) {
      console.error("Failed to load payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [page, search, statusFilter, methodFilter]);

  return (
    <div>
      <h2 className="section-title">Payments</h2>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input className="form-input" placeholder="Search by payment ID..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ width: "250px" }} />
        <select className="form-input" style={{ width: "auto" }} value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
        </select>
        <select className="form-input" style={{ width: "auto" }} value={methodFilter}
          onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}>
          <option value="">All Methods</option>
          <option value="Dummy">Dummy</option>
          <option value="CashOnDelivery">Cash on Delivery</option>
        </select>
      </div>

      {loading ? <p style={{ color: "#666" }}>Loading...</p> :
        payments.length === 0 ? <div className="empty-state">No payments found.</div> :
        <table className="product-table">
          <thead><tr><th>Payment ID</th><th>Order ID</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.paymentId}>
                <td>{p.paymentId.slice(0, 8).toUpperCase()}</td>
                <td>{p.orderId?.slice(0, 8).toUpperCase() || "N/A"}</td>
                <td>{p.method}</td>
                <td>PKR {p.amount?.toLocaleString()}</td>
                <td>{p.status}</td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
import { useState, useEffect } from "react";
import { getPayments } from "../../services/adminService";

const statusPillStyle = (status) => {
  const base = {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    display: "inline-block",
    whiteSpace: "nowrap",
  };
  switch (status) {
    case "Completed":
      return { ...base, backgroundColor: "#dcfce7", color: "#166534" };
    case "Pending":
      return { ...base, backgroundColor: "#fef3c7", color: "#92400e" };
    case "Failed":
      return { ...base, backgroundColor: "#fee2e2", color: "#991b1b" };
    case "Refunded":
      return { ...base, backgroundColor: "#e0e7ff", color: "#3730a3" };
    default:
      return { ...base, backgroundColor: "#f3f4f6", color: "#1f2937" };
  }
};

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter & sort state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { items, totalPages } = await getPayments({
        page,
        pageSize: 10,
        search,
        status: statusFilter,
        method: methodFilter,
        sortBy,
      });
      setPayments(items || []);
      setTotalPages(totalPages || 1);
    } catch (err) {
      console.error("Failed to load payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // reset to first page on filter/search/sort change
  }, [search, statusFilter, methodFilter, sortBy]);

  useEffect(() => {
    loadPayments();
  }, [page, search, statusFilter, methodFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Payments</h2>

      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: "1 1 200px" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payment or order ID"
            style={{
              flex: 1,
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "0.875rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: "#111827",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "0.875rem",
            background: "#fff",
          }}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "0.875rem",
            background: "#fff",
          }}
        >
          <option value="">All Methods</option>
          <option value="Stripe">Stripe</option>
          <option value="CashOnDelivery">Cash on Delivery</option>
          <option value="Dummy">Dummy</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "0.875rem",
            background: "#fff",
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="amount_asc">Amount: Low to High</option>
          <option value="amount_desc">Amount: High to Low</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Payment ID</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Order ID</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Method</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Amount</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Status</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.paymentId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                    {p.paymentId?.slice(0, 8).toUpperCase() ?? "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {p.orderId?.slice(0, 8).toUpperCase() ?? "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>{p.method || "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                    PKR {p.amount?.toLocaleString()}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={statusPillStyle(p.status)}>{p.status}</span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#6b7280" }}>
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              fontWeight: 500,
            }}
          >
            Previous
          </button>
          <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "#6b7280" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              fontWeight: 500,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
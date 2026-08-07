import { useState, useEffect } from "react";
import { getAdminShipments } from "../../services/adminService";

const AdminShipmentsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminShipments({ page, pageSize: 10, search, status: statusFilter });
      setShipments(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load shipments", err);
      setError("Could not load shipments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [page, search, statusFilter]);

  return (
    <div>
      <h2 className="section-title">Shipments</h2>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input className="form-input" placeholder="Search by tracking or carrier..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ width: "250px" }} />
        <select className="form-input" style={{ width: "auto" }} value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Packed">Packed</option>
          <option value="Dispatched">Dispatched</option>
          <option value="OutForDelivery">Out For Delivery</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: "#666" }}>Loading...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : shipments.length === 0 ? (
        <div className="empty-state">No shipments found.</div>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Shipment ID</th>
              <th>Order ID</th>
              <th>Carrier</th>
              <th>Tracking</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id}>
                <td>{s.id?.toString().slice(0, 8).toUpperCase()}</td>
                <td>
                  {(typeof s.sellerOrderId === 'string')
                    ? s.sellerOrderId.slice(0, 8).toUpperCase()
                    : (s.sellerOrderId?._id ? s.sellerOrderId._id.slice(0, 8).toUpperCase() : "N/A")}
                </td>
                <td>{s.carrier || "N/A"}</td>
                <td>{s.trackingNumber || "N/A"}</td>
                <td>{s.status}</td>
                <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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

export default AdminShipmentsPage;
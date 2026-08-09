import { useState, useEffect } from "react";
import { getAdminShipments } from "../../services/adminService";

const statusBadgeStyle = (status) => {
  const base = { display: "inline-block", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 };
  switch (status) {
    case "Delivered": return { ...base, backgroundColor: "#dcfce7", color: "#166534" };
    case "OutForDelivery": return { ...base, backgroundColor: "#fce7f3", color: "#9d174d" };
    case "Dispatched": return { ...base, backgroundColor: "#dbeafe", color: "#1e40af" };
    case "Packed": return { ...base, backgroundColor: "#e0e7ff", color: "#3730a3" };
    case "Pending": return { ...base, backgroundColor: "#fef3c7", color: "#92400e" };
    default: return { ...base, backgroundColor: "#f3f4f6", color: "#1f2937" };
  }
};

const AdminShipmentsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await getAdminShipments({ page, pageSize: 10, search, status: statusFilter });
      setShipments(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchShipments(); }, [page, search, statusFilter]);

  const openModal = (shipment) => {
    setSelectedShipment(shipment);
    setModalOpen(true);
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>Shipments</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>Track and manage order shipments</p>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <input placeholder="Search by tracking or carrier..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: "200px", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none" }} />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none", background: "#fff" }}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option><option value="Packed">Packed</option><option value="Dispatched">Dispatched</option>
            <option value="OutForDelivery">Out For Delivery</option><option value="Delivered">Delivered</option>
          </select>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : shipments.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No shipments found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Shipment ID</th>
                  <th>Order ID</th><th>Carrier</th><th>Tracking</th><th>Status</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.15s" }}
                    onClick={() => openModal(s)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td style={{ padding: "0.75rem 1.25rem", fontWeight: 500, color: "#111827" }}>{s.id?.toString().slice(0, 8).toUpperCase()}</td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "#4b5563" }}>
                      {(typeof s.sellerOrderId === 'string') ? s.sellerOrderId.slice(0, 8).toUpperCase() : (s.sellerOrderId?._id ? s.sellerOrderId._id.slice(0, 8).toUpperCase() : "N/A")}
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "#4b5563" }}>{s.carrier || "N/A"}</td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "#4b5563" }}>{s.trackingNumber || "N/A"}</td>
                    <td style={{ padding: "0.75rem 1.25rem" }}><span style={statusBadgeStyle(s.status)}>{s.status}</span></td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "#4b5563" }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "N/A"}</td>
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

        {/* Shipment Detail Modal */}
        {modalOpen && selectedShipment && (
          <div className="modal-overlay" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setModalOpen(false)}>
            <div className="modal-content" style={{ background: "#fff", borderRadius: "12px", padding: "2rem", maxWidth: "500px", width: "90%", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Shipment Details</h3>
                <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#6b7280" }}>×</button>
              </div>
              <p><strong>Shipment ID:</strong> {selectedShipment.id?.toString().slice(0, 8).toUpperCase()}</p>
              <p><strong>Order ID:</strong> {typeof selectedShipment.sellerOrderId === 'string' ? selectedShipment.sellerOrderId.slice(0, 8).toUpperCase() : (selectedShipment.sellerOrderId?._id ? selectedShipment.sellerOrderId._id.slice(0, 8).toUpperCase() : "N/A")}</p>
              <p><strong>Carrier:</strong> {selectedShipment.carrier || "N/A"}</p>
              <p><strong>Tracking Number:</strong> {selectedShipment.trackingNumber || "N/A"}</p>
              <p><strong>Status:</strong> <span style={statusBadgeStyle(selectedShipment.status)}>{selectedShipment.status}</span></p>
              <p><strong>Created:</strong> {selectedShipment.createdAt ? new Date(selectedShipment.createdAt).toLocaleString() : "N/A"}</p>
              {selectedShipment.trackingHistory && (
                <div style={{ marginTop: "1rem" }}>
                  <h4 style={{ fontWeight: 600 }}>Tracking History</h4>
                  {selectedShipment.trackingHistory.map((th, i) => (
                    <div key={i} style={{ fontSize: "0.9rem", marginLeft: "1rem" }}>
                      <span>{th.status}</span> {th.note && <span>– {th.note}</span>} <span style={{ color: "#6b7280" }}>{new Date(th.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShipmentsPage;
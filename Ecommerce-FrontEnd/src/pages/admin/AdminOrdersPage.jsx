import { useState, useEffect } from "react";
import { getAdminOrders } from "../../services/adminService";
import { fetchOrderById } from "../../services/orderService"; // reuse customer service
import { getImageUrl } from "../../utils/imageHelper";

const statusBadgeStyle = (status) => {
  const base = { display: "inline-block", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 };
  switch (status) {
    case "Delivered": return { ...base, backgroundColor: "#dcfce7", color: "#166534" };
    case "Pending": return { ...base, backgroundColor: "#fef3c7", color: "#92400e" };
    case "Processing": return { ...base, backgroundColor: "#dbeafe", color: "#1e40af" };
    case "Shipped": return { ...base, backgroundColor: "#e0e7ff", color: "#3730a3" };
    case "Cancelled": return { ...base, backgroundColor: "#fee2e2", color: "#991b1b" };
    default: return { ...base, backgroundColor: "#f3f4f6", color: "#1f2937" };
  }
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders({ page, pageSize: 10, search, status: statusFilter, sortBy: sort });
      setOrders(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, search, statusFilter, sort]);

  const openModal = async (order) => {
    try {
      const fullOrder = await fetchOrderById(order._id); // fetch detailed order
      setSelectedOrder(fullOrder);
    } catch (err) {
      setSelectedOrder(order); // fallback to list data
    }
    setModalOpen(true);
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>Orders</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>View and manage customer orders</p>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <input placeholder="Search by ID or customer email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: "200px", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none" }} />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none", background: "#fff" }}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option>
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none", background: "#fff" }}>
            <option value="newest">Newest First</option><option value="oldest">Oldest First</option>
          </select>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No orders found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Order ID</th>
                  <th>Customer</th><th>Date</th><th style={{ textAlign: "right" }}>Total</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id} style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.15s" }}
                    onClick={() => openModal(order)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td style={{ padding: "0.75rem 1.25rem", fontWeight: 500, color: "#111827" }}>{order._id.slice(0, 8).toUpperCase()}</td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "#4b5563" }}>{order.customer?.name || order.customer?.email || "N/A"}</td>
                    <td style={{ padding: "0.75rem 1.25rem", color: "#4b5563" }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "0.75rem 1.25rem", fontWeight: 600, color: "#111827", textAlign: "right" }}>PKR {order.totalAmount?.toLocaleString()}</td>
                    <td style={{ padding: "0.75rem 1.25rem" }}><span style={statusBadgeStyle(order.orderStatus)}>{order.orderStatus}</span></td>
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

        {/* Order Detail Modal */}
        {modalOpen && selectedOrder && (
          <div className="modal-overlay" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setModalOpen(false)}>
            <div className="modal-content" style={{ background: "#fff", borderRadius: "12px", padding: "2rem", maxWidth: "800px", width: "90%", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Order #{selectedOrder._id.slice(0, 8).toUpperCase()}</h3>
                <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#6b7280" }}>×</button>
              </div>
              <p><strong>Customer:</strong> {selectedOrder.customer?.name || "N/A"}</p>
              <p><strong>Email:</strong> {selectedOrder.customer?.email || "N/A"}</p>
              <p><strong>Status:</strong> <span style={statusBadgeStyle(selectedOrder.orderStatus)}>{selectedOrder.orderStatus}</span></p>
              <p><strong>Total:</strong> PKR {selectedOrder.totalAmount?.toLocaleString()}</p>
              <p><strong>Placed:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              <h4 style={{ marginTop: "1.5rem", fontWeight: 600 }}>Seller Orders</h4>
              {selectedOrder.sellerOrders?.map(so => (
                <div key={so._id} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
                  <p><strong>Store:</strong> {so.store?.name || "N/A"}</p>
                  <p><strong>Status:</strong> {so.status}</p>
                  <table style={{ width: "100%", marginTop: "0.5rem" }}>
                    <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                    <tbody>
                      {so.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.productNameSnapshot}</td>
                          <td>{item.quantity}</td>
                          <td>PKR {item.unitPriceSnapshot}</td>
                          <td>PKR {(item.unitPriceSnapshot * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ textAlign: "right", fontWeight: 600 }}>Subtotal: PKR {so.subTotal?.toLocaleString()}</p>
                  {so.shipment && (
                    <div style={{ marginTop: "0.5rem", background: "#f9fafb", padding: "0.5rem", borderRadius: "6px" }}>
                      <p><strong>Tracking:</strong> {so.shipment.trackingNumber || "N/A"} ({so.shipment.status})</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import ShipmentModal from "./ShipmentModal";

const ShipmentManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSellerOrderId, setSelectedSellerOrderId] = useState(null);
  const [selectedParentOrderId, setSelectedParentOrderId] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);

  const loadOrders = async () => {
  setLoading(true);
  try {
    const res = await axiosInstance.get("/seller/orders", {
      params: { page, pageSize: 10, _t: Date.now() },   // cache‑buster
    });
    const data = res.data?.data;
    setOrders(data.items || []);
    setTotalPages(data.totalPages || 1);
  } catch (err) {
    console.error("Failed to load orders", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadOrders();
  }, [page]);

  const openModal = (order, sellerOrder) => {
    setSelectedSellerOrderId(sellerOrder._id);
    setSelectedParentOrderId(order._id.slice(0, 8).toUpperCase());
    setSelectedShipment(sellerOrder.shipment || null);
    setModalOpen(true);
  };

  const handleShipmentSaved = () => {
    loadOrders();               // refresh the whole order list
    setModalOpen(false);
  };

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading orders...</div>;

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      <h2 className="section-title">Shipment Management</h2>

      {orders.length === 0 ? (
        <div className="empty-state">No orders found.</div>
      ) : (
        <>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Order ID</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Date</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Store</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Order Status</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Shipment</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
  {orders.map((order) => {
    const sellerOrder = order.sellerOrders?.[0];
    if (!sellerOrder) return null;
    const shipment = sellerOrder.shipment;

    // Status badge colors
    const getStatusBadgeStyle = (status) => {
      const base = {
        padding: "4px 12px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        display: "inline-block",
        textAlign: "center",
        minWidth: "100px",
      };
      switch (status) {
        case "Pending":
          return { ...base, background: "#fef3c7", color: "#92400e" };
        case "Processing":
          return { ...base, background: "#e0e7ff", color: "#3730a3" };
        case "Packed":
        case "Dispatched":
          return { ...base, background: "#dbeafe", color: "#1e40af" };
        case "OutForDelivery":
          return { ...base, background: "#fce7f3", color: "#9d174d" };
        case "Delivered":
          return { ...base, background: "#d1fae5", color: "#065f46" };
        default:
          return { ...base, background: "#f3f4f6", color: "#1f2937" };
      }
    };

    return (
      <tr key={sellerOrder._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
        <td style={{ padding: "0.75rem 1rem" }}>{order._id.slice(0, 8).toUpperCase()}</td>
        <td style={{ padding: "0.75rem 1rem" }}>{new Date(order.createdAt).toLocaleDateString()}</td>
        <td style={{ padding: "0.75rem 1rem" }}>{sellerOrder.store?.name || "Store"}</td>

        {/* Order Status – badge only, no tracking */}
        <td style={{ padding: "0.75rem 1rem" }}>
          <span style={getStatusBadgeStyle(sellerOrder.status)}>
            {sellerOrder.status}
          </span>
        </td>

        {/* Shipment – tracking + carrier, NO status */}
        <td style={{ padding: "0.75rem 1rem" }}>
          {shipment ? (
            <span>
              {shipment.carrier && `${shipment.carrier} – `}
              {shipment.trackingNumber || "N/A"}
            </span>
          ) : (
            <span style={{ color: "#9ca3af" }}>Not yet created</span>
          )}
        </td>

        <td style={{ padding: "0.75rem 1rem" }}>
          <button
            className="btn-edit"
            onClick={() => openModal(order, sellerOrder)}
          >
            {shipment ? "Manage Shipment" : "Create Shipment"}
          </button>
        </td>
      </tr>
    );
  })}
</tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <ShipmentModal
          sellerOrderId={selectedSellerOrderId}
          parentOrderId={selectedParentOrderId}
          shipment={selectedShipment}
          onClose={() => setModalOpen(false)}
          onSaved={handleShipmentSaved}
        />
      )}
    </div>
  );
};

export default ShipmentManagementPage;
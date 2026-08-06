import { useState, useEffect } from "react";
import { getShipmentByOrder, createShipment, updateShipmentStatus } from "../../services/sellerShipmentService";
import axiosInstance from "../../services/axiosInstance";

const ShipmentManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shipmentData, setShipmentData] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [statusForm, setStatusForm] = useState({ status: "", note: "" });
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get("/seller/orders");
        setOrders(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadShipment = async (sellerOrderId) => {
    try {
      const data = await getShipmentByOrder(sellerOrderId);
      setShipmentData(data);
      setSelectedOrder(sellerOrderId);
    } catch (err) {
      setShipmentData(null);
      setSelectedOrder(sellerOrderId);
    }
  };

  const handleCreateShipment = async () => {
    if (!selectedOrder) return;
    try {
      const data = await createShipment(selectedOrder, trackingNumber, carrier);
      setShipmentData(data);
      setFormVisible(false);
      setMessage({ text: "Shipment created.", type: "success" });
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to create shipment.", type: "error" });
    }
  };

  const handleUpdateStatus = async () => {
    if (!shipmentData?._id) return;
    try {
      const updated = await updateShipmentStatus(shipmentData._id, statusForm.status, statusForm.note);
      setShipmentData(updated);
      setStatusForm({ status: "", note: "" });
      setMessage({ text: "Status updated.", type: "success" });
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to update status.", type: "error" });
    }
  };

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading orders...</div>;

  return (
    <div>
      <h2 className="section-title">Shipment Management</h2>

      {orders.length === 0 ? (
        <div className="empty-state">No orders found.</div>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Store</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
         <tbody>
  {orders.map((order) =>
    order.sellerOrders.map((so) => (
      <tr key={so._id}>
        <td>{order._id.slice(0, 8).toUpperCase()}</td>
        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
        <td>{so.store?.name || "Store"}</td>
        <td>{so.status}</td>
        <td>
          <button className="btn-edit" onClick={() => loadShipment(so._id)}>Manage Shipment</button>
        </td>
      </tr>
    ))
  )}
</tbody>
        </table>
      )}

      {selectedOrder && (
        <div className="shipment-panel" style={{ marginTop: "2rem", padding: "1.5rem", background: "#fff", border: "1px solid #eaeaea", borderRadius: "0.5rem" }}>
          <h3>Shipment for Order #{selectedOrder.slice(0, 8).toUpperCase()}</h3>

          {shipmentData ? (
            <>
              <p>
                <strong>Carrier:</strong> {shipmentData.carrier || "N/A"} | <strong>Tracking:</strong> {shipmentData.trackingNumber || "N/A"} | <strong>Status:</strong> {shipmentData.status || "N/A"}
              </p>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <select
                  className="form-input"
                  style={{ width: "auto" }}
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                >
                  <option value="">Update Status</option>
                  <option value="Packed">Packed</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="OutForDelivery">Out For Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Note"
                  value={statusForm.note}
                  onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                  style={{ width: "200px" }}
                />
                <button className="btn-primary" onClick={handleUpdateStatus} style={{ width: "auto" }}>
                  Update
                </button>
              </div>

              {shipmentData.trackingHistory?.length > 0 && (
                <div className="tracking-history" style={{ marginTop: "1.5rem", borderLeft: "2px solid #000", paddingLeft: "1rem" }}>
                  {shipmentData.trackingHistory.map((th, i) => (
                    <div key={i} className="tracking-step" style={{ marginBottom: "0.5rem", fontSize: "0.9rem", color: "#333" }}>
                      <span>{th.status}</span>
                      {th.note && <span> – {th.note}</span>}
                      <span style={{ color: "#888", marginLeft: "auto", fontSize: "0.8rem" }}>{new Date(th.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p style={{ color: "#666" }}>No shipment created yet.</p>
              {!formVisible ? (
                <button className="btn-primary" onClick={() => setFormVisible(true)} style={{ width: "auto" }}>
                  Create Shipment
                </button>
              ) : (
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Carrier"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    style={{ width: "200px" }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tracking Number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    style={{ width: "250px" }}
                  />
                  <button className="btn-primary" onClick={handleCreateShipment} style={{ width: "auto" }}>
                    Save
                  </button>
                </div>
              )}
            </>
          )}

          {message.text && (
            <p style={{ color: message.type === "success" ? "#000" : "#d11a2a", marginTop: "1rem", fontWeight: 500 }}>
              {message.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ShipmentManagementPage;
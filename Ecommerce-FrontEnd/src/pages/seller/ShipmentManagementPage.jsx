import { useState, useEffect } from "react";
import { fetchSellerOrders } from "../../services/sellerOrderService";
import axiosInstance from "../../services/axiosInstance";

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
    case "Delivered":
      return { ...base, backgroundColor: "#d1fae5", color: "#065f46" };
    case "Processing":
    case "Pending":
    case "OutForDelivery":
      return { ...base, backgroundColor: "#fef3c7", color: "#92400e" };
    case "Cancelled":
      return { ...base, backgroundColor: "#fee2e2", color: "#991b1b" };
    default:
      return { ...base, backgroundColor: "#f3f4f6", color: "#1f2937" };
  }
};

const renderItemSummary = (sellerOrders) => {
  const allItems = sellerOrders.flatMap(so => so.items || []);
  if (allItems.length === 0) return "No items";
  const first = allItems[0];
  const restCount = allItems.length - 1;
  return (
    <div style={{ fontSize: "0.85rem", color: "#374151" }}>
      <span style={{ fontWeight: 500 }}>
        {first.productNameSnapshot || first.product?.name || "Product"}
      </span>
      <span style={{ color: "#6b7280" }}> (x{first.quantity})</span>
      {restCount > 0 && (
        <span style={{ color: "#2563eb", fontWeight: 500, marginLeft: "0.25rem" }}>
          + {restCount} more
        </span>
      )}
    </div>
  );
};

const ShipmentManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("Pending");
  const [savingShipment, setSavingShipment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // sessionHistory removed entirely

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchSellerOrders({ page, pageSize: 10 });
      const items = res.items || [];
      setOrders(items);
      setTotalPages(res.totalPages || 1);
      return items;
    } catch (err) {
      console.error("Failed to load orders", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page]);

  const openShipmentDrawer = (order) => {
    setSelectedOrder(order);
    const firstSO = order.sellerOrders[0];
    if (firstSO?.shipment) {
      setCourier(firstSO.shipment.carrier || "");
      setTrackingNumber(firstSO.shipment.trackingNumber || "");
      setShipmentStatus(firstSO.shipment.status || "Pending");
    } else {
      setCourier("");
      setTrackingNumber("");
      setShipmentStatus("Pending");
    }
    // No sessionHistory reset needed
    setDrawerOpen(true);
  };

  // Save courier/tracking details (create or update)
  const handleSaveShipment = async () => {
    if (!selectedOrder) return;
    setSavingShipment(true);
    try {
      const sellerOrderId = selectedOrder.sellerOrders[0]._id;
      const shipment = selectedOrder.sellerOrders[0].shipment;
      if (shipment?._id) {
        await axiosInstance.put(`/shipments/${shipment._id}`, {
          carrier: courier,
          trackingNumber,
        });
      } else {
        await axiosInstance.post("/shipments", {
          sellerOrder: sellerOrderId,
          carrier: courier,
          trackingNumber,
        });
      }
      setDrawerOpen(false);
      loadOrders();
    } catch (err) {
      console.error("Failed to save shipment", err);
      alert("Could not save shipment details.");
    } finally {
      setSavingShipment(false);
    }
  };

  // Update shipment status and keep the drawer open with fresh data
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    const shipment = selectedOrder.sellerOrders[0]?.shipment;
    if (!shipment?._id) return;
    setUpdatingStatus(true);
    try {
      await axiosInstance.put(`/shipments/${shipment._id}/status`, {
        status: shipmentStatus,
      });

      // Re‑fetch all orders to get the latest trackingHistory
      const allItems = await loadOrders();

      // Update the selected order inside the drawer so the timeline shows the new entry immediately
      if (allItems.length > 0) {
        const updatedOrder = allItems.find(o => o._id === selectedOrder._id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
          // keep courier/tracking fields synced
          const so = updatedOrder.sellerOrders[0];
          if (so?.shipment) {
            setCourier(so.shipment.carrier || "");
            setTrackingNumber(so.shipment.trackingNumber || "");
            setShipmentStatus(so.shipment.status || "Pending");
          }
        }
      }
      // Do NOT close the drawer – the seller can see the updated timeline
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Could not update shipment status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading)
    return <div style={{ padding: "2rem", color: "#666" }}>Loading shipments...</div>;

  if (orders.length === 0) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
        No orders awaiting shipment.
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Shipment Management
      </h2>

      {/* Table Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto",
          gap: "1rem",
          padding: "0.75rem 1rem",
          backgroundColor: "#f9fafb",
          borderRadius: "8px 8px 0 0",
          border: "1px solid #e5e7eb",
          borderBottom: "none",
          fontWeight: 600,
          fontSize: "0.85rem",
          color: "#4b5563",
          alignItems: "center",
        }}
      >
        <div>Order Details</div>
        <div>Items</div>
        <div>Destination</div>
        <div>Date & Status</div>
        <div>Tracking / Shipment</div>
        <div>Actions</div>
      </div>

      {/* Table Rows */}
      <div style={{ border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
        {orders.map((order) => {
          const sellerOrders = order.sellerOrders || [];
          const firstSO = sellerOrders[0] || {};
          const shipment = firstSO.shipment;
          const isDelivered = order.orderStatus === "Delivered";

          return (
            <div
              key={order._id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto",
                gap: "1rem",
                padding: "1rem",
                borderBottom: "1px solid #f3f4f6",
                alignItems: "center",
                backgroundColor: "#fff",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>
                  Order #{order._id.toString().slice(-8).toUpperCase()}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "2px" }}>
                  {order.customerName}
                </div>
              </div>

              <div>{renderItemSummary(sellerOrders)}</div>

              <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                📍 {order.shippingLocation || '—'}
              </div>

              <div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
                <div style={{ marginTop: "4px" }}>
                  <span style={statusPillStyle(order.orderStatus)}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: "0.85rem" }}>
                {shipment ? (
                  <div>
                    <div style={{ fontWeight: 500, color: "#111827" }}>
                      {shipment.carrier || 'N/A'}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                      {shipment.trackingNumber || 'No tracking'}
                    </div>
                  </div>
                ) : (
                  <span style={{ color: "#9ca3af" }}>Not yet created</span>
                )}
              </div>

              <div>
                {!isDelivered && (
                  <>
                    {!shipment ? (
                      <button
                        onClick={() => openShipmentDrawer(order)}
                        style={{
                          backgroundColor: "#111827",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Create
                      </button>
                    ) : (
                      <button
                        onClick={() => openShipmentDrawer(order)}
                        style={{
                          backgroundColor: "#f3f4f6",
                          color: "#111827",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Manage
                      </button>
                    )}
                  </>
                )}
                {isDelivered && (
                  <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Delivered</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "#6b7280" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Side Drawer */}
      {drawerOpen && selectedOrder && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              zIndex: 998,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "500px",
              maxWidth: "90vw",
              height: "100vh",
              backgroundColor: "#fff",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
              zIndex: 999,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 2rem 1rem", borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                {selectedOrder.sellerOrders[0]?.shipment ? "Manage Shipment" : "Create Shipment"}
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ×
              </button>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
              <div style={{ marginBottom: "2rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Order #{selectedOrder._id.toString().slice(-8).toUpperCase()}
                </p>
                <p style={{ color: "#4b5563", fontSize: "0.9rem" }}>
                  <strong>Customer:</strong> {selectedOrder.customerName}
                </p>
                <p style={{ color: "#4b5563", fontSize: "0.9rem" }}>
                  <strong>Destination:</strong> {selectedOrder.shippingLocation}
                </p>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Items</h4>
                {selectedOrder.sellerOrders.flatMap(so => so.items).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", fontSize: "0.9rem", color: "#374151" }}>
                    <span>{item.productNameSnapshot || item.product?.name || "Product"}</span>
                    <span>x{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Shipment Details</h4>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.25rem" }}>Courier</label>
                  <input
                    type="text"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="e.g., Leopard, TCS"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.25rem" }}>Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking ID"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                {selectedOrder.sellerOrders[0]?.shipment?._id && (
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.25rem" }}>Update Status</label>
                    <select
                      value={shipmentStatus}
                      onChange={(e) => setShipmentStatus(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        fontSize: "0.9rem",
                        background: "#fff",
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Packed">Packed</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="OutForDelivery">Out For Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={updatingStatus}
                      style={{
                        marginTop: "0.75rem",
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "#2563eb",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: updatingStatus ? "not-allowed" : "pointer",
                        opacity: updatingStatus ? 0.6 : 1,
                      }}
                    >
                      {updatingStatus ? "Updating..." : "Update Status"}
                    </button>
                  </div>
                )}
              </div>

              {/* Real backend trackingHistory timeline */}
              {selectedOrder.sellerOrders[0]?.shipment?.trackingHistory?.length > 0 && (
                <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                  <h4 style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem", color: "#111827" }}>Update History</h4>
                  <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
                    <div style={{ position: "absolute", left: "8px", top: "8px", bottom: "0", width: "1px", backgroundColor: "#e5e7eb" }} />
                    {[...selectedOrder.sellerOrders[0].shipment.trackingHistory].reverse().map((entry, index) => (
                      <div key={index} style={{ position: "relative", marginBottom: "1rem", paddingLeft: "0.5rem" }}>
                        <div style={{
                          position: "absolute",
                          left: "-22px",
                          top: "4px",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#2563eb",
                          border: "2px solid #fff",
                          zIndex: 1,
                        }} />
                        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.15rem" }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 500 }}>
                          Status updated to <strong>{entry.status}</strong>
                        </div>
                        {entry.location && (
                          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                            Location: {entry.location}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "1rem 2rem", borderTop: "1px solid #e5e7eb", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveShipment}
                disabled={savingShipment}
                style={{
                  backgroundColor: "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: savingShipment ? "not-allowed" : "pointer",
                  opacity: savingShipment ? 0.6 : 1,
                }}
              >
                {savingShipment ? "Saving..." : "Save Shipment"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShipmentManagementPage;
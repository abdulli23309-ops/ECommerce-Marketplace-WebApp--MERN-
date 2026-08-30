import { useState, useEffect } from "react";
import { fetchSellerOrders } from "../../services/sellerOrderService";
import axiosInstance from "../../services/axiosInstance";
import { getStatusBadgeStyle } from "../../utils/statusBadge";
import { toastError, toastWarning } from "../../components/common/Toast";

const renderItemSummary = (sellerOrders) => {
  const allItems = sellerOrders.flatMap(so => so.items || []);
  if (allItems.length === 0) return "No items";
  const first = allItems[0];
  const restCount = allItems.length - 1;
  return (
    <div style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
      <span style={{ fontWeight: 500 }}>
        {first.productNameSnapshot || first.product?.name || "Product"}
      </span>
      <span style={{ color: "var(--text-secondary)" }}> (x{first.quantity})</span>
      {restCount > 0 && (
        <span style={{ color: "var(--info)", fontWeight: 500, marginLeft: "0.25rem" }}>
          + {restCount} more
        </span>
      )}
    </div>
  );
};

const shipmentStatusOrder = [
  "Pending",
  "Packed",
  "Dispatched",
  "OutForDelivery",
  "Delivered",
];

const ShipmentManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("Pending");
  const [savingShipment, setSavingShipment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
    setDrawerOpen(true);
  };

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
      toastError("Could not save shipment details.");
    } finally {
      setSavingShipment(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    const shipment = selectedOrder.sellerOrders[0]?.shipment;
    if (!shipment?._id) return;

    if (shipmentStatus === shipment.status) {
      toastWarning("This status is already applied.");
      return;
    }

    setUpdatingStatus(true);
    try {
      await axiosInstance.put(`/shipments/${shipment._id}/status`, {
        status: shipmentStatus,
      });

      const allItems = await loadOrders();
      if (allItems.length > 0) {
        const updatedOrder = allItems.find(o => o._id === selectedOrder._id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
          const so = updatedOrder.sellerOrders[0];
          if (so?.shipment) {
            setCourier(so.shipment.carrier || "");
            setTrackingNumber(so.shipment.trackingNumber || "");
            setShipmentStatus(so.shipment.status || "Pending");
          }
        }
      }
    } catch (err) {
      console.error("Failed to update status", err);
      toastError("Could not update shipment status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading)
    return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading shipments...</div>;

  if (orders.length === 0) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
        No orders awaiting shipment.
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>
        Shipment Management
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto",
          gap: "1rem",
          padding: "0.75rem 1rem",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "8px 8px 0 0",
          border: "1px solid var(--border)",
          borderBottom: "none",
          fontWeight: 600,
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
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

      <div style={{ border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
        {orders.map((order) => {
          const sellerOrders = order.sellerOrders || [];
          const firstSO = sellerOrders[0] || {};
          const shipment = firstSO.shipment;
          const isDelivered = order.orderStatus === "Delivered";
          const isCancelled = order.orderStatus === "Cancelled" || sellerOrders.some(so => so.status === "Cancelled");

          return (
            <div
              key={order._id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto",
                gap: "1rem",
                padding: "1rem",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
                backgroundColor: "var(--surface)",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                  Order #{order._id.toString().slice(-8).toUpperCase()}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {order.customerName}
                </div>
              </div>

              <div>{renderItemSummary(sellerOrders)}</div>

              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                📍 {order.shippingLocation || '—'}
              </div>

              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
                <div style={{ marginTop: "4px" }}>
                  <span style={getStatusBadgeStyle(order.orderStatus)}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: "0.85rem" }}>
                {shipment ? (
                  <div>
                    <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                      {shipment.carrier || 'N/A'}
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                      {shipment.trackingNumber || 'No tracking'}
                    </div>
                  </div>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>Not yet created</span>
                )}
              </div>

              <div>
                {isDelivered ? (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Delivered</span>
                ) : isCancelled ? (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Cancelled</span>
                ) : (
                  <>
                    {!shipment ? (
                      <button
                        onClick={() => openShipmentDrawer(order)}
                        style={{
                          backgroundColor: "var(--primary)",
                          color: "var(--primary-contrast)",
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
                          backgroundColor: "var(--surface-hover)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border)",
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
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
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
              backgroundColor: "var(--surface)",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
              zIndex: 999,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 2rem 1rem", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                {selectedOrder.sellerOrders[0]?.shipment ? "Manage Shipment" : "Create Shipment"}
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
              <div style={{ marginBottom: "2rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                  Order #{selectedOrder._id.toString().slice(-8).toUpperCase()}
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  <strong>Customer:</strong> {selectedOrder.customerName}
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  <strong>Destination:</strong> {selectedOrder.shippingLocation}
                </p>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-primary)" }}>Items</h4>
                {selectedOrder.sellerOrders.flatMap(so => so.items).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    <span>{item.productNameSnapshot || item.product?.name || "Product"}</span>
                    <span>x{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-primary)" }}>Shipment Details</h4>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.25rem", color: "var(--text-primary)" }}>Courier</label>
                  <input
                    type="text"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="e.g., Leopard, TCS"
                    disabled={selectedOrder.sellerOrders[0]?.shipment?._id ? true : false}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--input-border)",
                      fontSize: "0.9rem",
                      opacity: selectedOrder.sellerOrders[0]?.shipment?._id ? 0.6 : 1,
                      backgroundColor: selectedOrder.sellerOrders[0]?.shipment?._id ? "var(--disabled-bg)" : "var(--input-bg)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.25rem", color: "var(--text-primary)" }}>Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking ID"
                    disabled={selectedOrder.sellerOrders[0]?.shipment?._id ? true : false}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--input-border)",
                      fontSize: "0.9rem",
                      opacity: selectedOrder.sellerOrders[0]?.shipment?._id ? 0.6 : 1,
                      backgroundColor: selectedOrder.sellerOrders[0]?.shipment?._id ? "var(--disabled-bg)" : "var(--input-bg)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {selectedOrder.sellerOrders[0]?.shipment?._id && (
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.25rem", color: "var(--text-primary)" }}>Update Status</label>
                    <select
                      value={shipmentStatus}
                      onChange={(e) => setShipmentStatus(e.target.value)}
                      disabled={selectedOrder.sellerOrders[0]?.shipment?.status === "Delivered"}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        border: "1px solid var(--input-border)",
                        fontSize: "0.9rem",
                        background: "var(--input-bg)",
                        color: "var(--text-primary)",
                        opacity: selectedOrder.sellerOrders[0]?.shipment?.status === "Delivered" ? 0.6 : 1,
                      }}
                    >
                      {shipmentStatusOrder.map((statusOption) => {
                        const currentIndex = shipmentStatusOrder.indexOf(selectedOrder.sellerOrders[0]?.shipment?.status);
                        const optionIndex = shipmentStatusOrder.indexOf(statusOption);
                        return (
                          <option
                            key={statusOption}
                            value={statusOption}
                            disabled={
                              currentIndex !== -1 && optionIndex <= currentIndex && statusOption !== selectedOrder.sellerOrders[0]?.shipment?.status
                            }
                          >
                            {statusOption}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={updatingStatus || selectedOrder.sellerOrders[0]?.shipment?.status === "Delivered"}
                      style={{
                        marginTop: "0.75rem",
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "#2563eb",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: (updatingStatus || selectedOrder.sellerOrders[0]?.shipment?.status === "Delivered") ? "not-allowed" : "pointer",
                        opacity: (updatingStatus || selectedOrder.sellerOrders[0]?.shipment?.status === "Delivered") ? 0.6 : 1,
                      }}
                    >
                      {updatingStatus ? "Updating..." : "Update Status"}
                    </button>
                  </div>
                )}
              </div>

              {selectedOrder.sellerOrders[0]?.shipment?.trackingHistory?.length > 0 && (
                <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                  <h4 style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem", color: "var(--text-primary)" }}>Update History</h4>
                  <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
                    <div style={{ position: "absolute", left: "8px", top: "8px", bottom: "0", width: "1px", backgroundColor: "var(--border)" }} />
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
                          border: "2px solid var(--surface)",
                          zIndex: 1,
                        }} />
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.15rem" }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500 }}>
                          Status updated to <strong>{entry.status}</strong>
                        </div>
                        {entry.location && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Location: {entry.location}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "1rem 2rem", borderTop: "1px solid var(--border)", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  backgroundColor: "var(--surface-hover)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
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
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-contrast)",
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
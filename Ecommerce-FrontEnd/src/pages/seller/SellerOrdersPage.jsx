import { useState, useEffect } from "react";
import { fetchSellerOrders } from "../../services/sellerOrderService";
import ShipmentModal from "./ShipmentModal";

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Shipment modal state
  const [selectedSellerOrderId, setSelectedSellerOrderId] = useState(null);
  const [selectedParentOrderId, setSelectedParentOrderId] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchSellerOrders({ page, pageSize: 10 });
      setOrders(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load seller orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page]);

  const toggleOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const openShipmentModal = (so) => {
    setSelectedSellerOrderId(so._id);
    setSelectedParentOrderId(so._id.slice(0, 8).toUpperCase());
    setSelectedShipment(so.shipment || null);
    setModalOpen(true);
  };

  const handleShipmentSaved = (updatedShipment) => {
    // Refresh orders to reflect updated shipment status
    loadOrders();
    setSelectedShipment(updatedShipment);
  };

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading orders...</div>;

  return (
    <div>
      <h2 className="section-title">Orders</h2>

      {orders.length === 0 ? (
        <div className="empty-state">No orders yet.</div>
      ) : (
        <>
          {orders.map((order) => (
            <div
              className="order-card"
              key={order._id}
              style={{
                marginBottom: "1rem",
                border: "1px solid #eaeaea",
                borderRadius: "0.5rem",
                padding: "1rem",
              }}
            >
              <div
                className="order-card-header"
                onClick={() => toggleOrder(order._id)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span>Order #{order._id.slice(0, 8).toUpperCase()}</span>
                  <span> · {new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, marginRight: "1rem" }}>
                    {order.orderStatus || order.status || "Unknown"}
                  </span>
                  <span>PKR {Number(order.totalAmount ?? 0).toLocaleString()}</span>
                </div>
              </div>

              {expandedOrderId === order._id && (
                <div className="order-card-body" style={{ marginTop: "1rem" }}>
                  {order.sellerOrders.map((so) => (
                    <div
                      className="seller-order"
                      key={so._id}
                      style={{
                        marginBottom: "1rem",
                        padding: "0.5rem",
                        background: "#f9fafb",
                        borderRadius: "0.25rem",
                      }}
                    >
                      <div
                        className="seller-order-header"
                        style={{ display: "flex", justifyContent: "space-between" }}
                      >
                        <span>{so.store?.name || "Store"}</span>
                        <span>{so.status}</span>
                      </div>
                      {so.items.map((item, idx) => (
                        <div
                          className="order-item"
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.9rem",
                          }}
                        >
                          <span>
                            {item.productNameSnapshot || item.productName} × {item.quantity}
                          </span>
                          <span>
                            PKR{" "}
                            {Number(
                              (item.unitPriceSnapshot ?? item.unitPrice ?? 0) *
                                item.quantity
                            ).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div
                        style={{
                          textAlign: "right",
                          fontWeight: 600,
                          marginTop: "0.5rem",
                        }}
                      >
                        Subtotal: PKR {Number(so.subTotal ?? 0).toLocaleString()}
                      </div>

                      {/* Shipment info or button to open modal */}
                      {so.shipment ? (
                        <div
                          style={{
                            marginTop: "0.5rem",
                            padding: "0.5rem",
                            background: "#fff",
                            borderRadius: "0.25rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>
                            Tracking: {so.shipment.trackingNumber || "N/A"} (
                            {so.shipment.status})
                          </span>
                          <button
                            className="btn-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openShipmentModal(so);
                            }}
                          >
                            Manage Shipment
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            marginTop: "0.5rem",
                            padding: "0.5rem",
                            background: "#fff",
                            borderRadius: "0.25rem",
                            textAlign: "right",
                          }}
                        >
                          <button
                            className="btn-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openShipmentModal(so);
                            }}
                          >
                            Create Shipment
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
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

export default SellerOrdersPage;
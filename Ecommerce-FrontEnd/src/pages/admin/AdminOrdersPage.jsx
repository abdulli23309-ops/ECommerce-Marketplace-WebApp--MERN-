import { useState, useEffect } from "react";
import { getAdminOrders } from "../../services/adminService";
import { fetchOrderById } from "../../services/orderService";
import { getStatusBadgeStyle } from "../../utils/statusBadge";
import ErrorState from "../../components/common/ErrorState";

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
  const [loadError, setLoadError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getAdminOrders({
        page,
        pageSize: 10,
        search,
        status: statusFilter,
        sortBy: sort,
      });
      setOrders(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error(err);
      setLoadError(err.response?.status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, search, statusFilter, sort]);

  const openModal = async (order) => {
    try {
      const fullOrder = await fetchOrderById(order._id);
      setSelectedOrder(fullOrder);
    } catch (err) {
      setSelectedOrder(order);
    }
    setModalOpen(true);
  };

  // Escape-to-close + body scroll lock for Order Detail modal
  useEffect(() => {
    if (!modalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [modalOpen]);

  return (
    <div
      style={{
        backgroundColor: "var(--bg-secondary)",
        minHeight: "100vh",
        padding: "2rem",
        color: "var(--text-primary)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Orders
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            View and manage customer orders
          </p>
        </div>

        {/* Toolbar */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            boxShadow: "0 1px 3px var(--shadow)",
            border: "1px solid var(--border)",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <input
            placeholder="Search by ID or customer email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid var(--input-border)",
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid var(--input-border)",
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              outline: "none",
            }}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid var(--input-border)",
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              outline: "none",
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Orders Table Card */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            boxShadow: "0 1px 3px var(--shadow)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              Loading...
            </div>
          ) : loadError ? (
            <ErrorState statusCode={loadError} onRetry={() => fetchOrders()} />
          ) : orders.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              No orders found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="orders-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Order ID
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Customer
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "right",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Total
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onClick={() => openModal(order)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--surface-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--surface)")
                    }
                  >
                    <td
                      style={{
                        padding: "0.75rem 1.25rem",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                      }}
                    >
                      {order._id.slice(0, 8).toUpperCase()}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1.25rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {order.customer?.name ||
                        order.customer?.email ||
                        "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1.25rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1.25rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        textAlign: "right",
                      }}
                    >
                      PKR {order.totalAmount?.toLocaleString()}
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <span style={getStatusBadgeStyle(order.orderStatus)}>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span
              style={{
                alignSelf: "center",
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
              }}
            >
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

        {/* Order Detail Modal */}
        {modalOpen && selectedOrder && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setModalOpen(false)}
          >
            <div
              className="modal-content"
              style={{
                background: "var(--surface)",
                color: "var(--text-primary)",
                borderRadius: "12px",
                padding: "2rem",
                maxWidth: "800px",
                width: "90%",
                maxHeight: "80vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3
                  id="order-modal-title"
                  style={{
                    margin: 0,
                                        fontSize: "1.2rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Order #{selectedOrder._id.slice(0, 8).toUpperCase()}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
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

              <p>
                <strong>Customer:</strong>{" "}
                {selectedOrder.customer?.name || "N/A"}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {selectedOrder.customer?.email || "N/A"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span style={getStatusBadgeStyle(selectedOrder.orderStatus)}>
                  {selectedOrder.orderStatus}
                </span>
              </p>
              <p>
                <strong>Total:</strong> PKR{" "}
                {selectedOrder.totalAmount?.toLocaleString()}
              </p>
              <p>
                <strong>Placed:</strong>{" "}
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>

              <h4 style={{ marginTop: "1.5rem", fontWeight: 600 }}>
                Seller Orders
              </h4>

              {selectedOrder.sellerOrders?.map((so) => (
                <div
                  key={so._id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginBottom: "1rem",
                    background: "var(--surface)",
                  }}
                >
                  <p>
                    <strong>Store:</strong> {so.store?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Status:</strong> {so.status}
                  </p>

                  <table
                    style={{
                      width: "100%",
                      marginTop: "0.5rem",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", color: "var(--text-secondary)" }}>
                          Product
                        </th>
                        <th style={{ textAlign: "left", color: "var(--text-secondary)" }}>
                          Qty
                        </th>
                        <th style={{ textAlign: "left", color: "var(--text-secondary)" }}>
                          Price
                        </th>
                        <th style={{ textAlign: "left", color: "var(--text-secondary)" }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {so.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.productNameSnapshot}</td>
                          <td>{item.quantity}</td>
                          <td>PKR {item.unitPriceSnapshot}</td>
                          <td>
                            PKR{" "}
                            {(
                              item.unitPriceSnapshot * item.quantity
                            ).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p
                    style={{
                      textAlign: "right",
                      fontWeight: 600,
                      marginTop: "0.5rem",
                    }}
                  >
                    Subtotal: PKR {so.subTotal?.toLocaleString()}
                  </p>

                  {so.shipment && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        background: "var(--bg-secondary)",
                        padding: "0.5rem",
                        borderRadius: "6px",
                      }}
                    >
                      <p>
                        <strong>Tracking:</strong>{" "}
                        {so.shipment.trackingNumber || "N/A"} (
                        {so.shipment.status})
                      </p>
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
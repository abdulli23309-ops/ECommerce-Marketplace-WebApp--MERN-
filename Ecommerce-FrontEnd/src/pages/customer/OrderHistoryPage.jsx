import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchOrders } from "../../services/orderService";
import { getStatusBadgeStyle } from "../../utils/statusBadge";

const StoreIcon = () => (
  <svg style={{ width: 16, height: 16, marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0H7m0 0H5m0 0H3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h2m4 0h.01" />
  </svg>
);

const PackageIcon = () => (
  <svg style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const getDisplayStatus = (order) => {
  if (!order) return "Pending";
  if (order.orderStatus === 'Cancelled') return 'Cancelled';
  if (order.orderStatus === 'Delivered') return 'Delivered';
  const sellerStatuses = (order.sellerOrders || []).map(so => so.status);
  if (sellerStatuses.includes("Cancelled")) return "Cancelled";
  if (sellerStatuses.includes("Delivered")) return "Delivered";
  if (sellerStatuses.includes("OutForDelivery")) return "Out for Delivery";
  if (sellerStatuses.some(s => ["Shipped", "Dispatched"].includes(s))) return "Shipped";
  if (sellerStatuses.includes("Processing")) return "Processing";
  return "Pending";
};
const filterCategories = ["All Orders", "Processing", "Delivered", "Cancelled"];

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All Orders");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchOrders({ page, pageSize: 10 });
      setOrders(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const filteredOrders = orders.filter(order => {
    if (activeFilter === "All Orders") return true;
    const status = getDisplayStatus(order);
    if (activeFilter === "Processing") return status === "Pending" || status === "Processing" || status === "Shipped" || status === "OutForDelivery";
    if (activeFilter === "Delivered") return status === "Delivered";
    if (activeFilter === "Cancelled") return status === "Cancelled";
    return true;
  });

  const pageBg = { backgroundColor: "var(--bg-secondary)", minHeight: "100vh", padding: "40px 20px", fontFamily: "Arial, sans-serif" };
  const container = { maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" };
  const heading = { fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 };
  const filterRow = { display: "flex", gap: "12px", flexWrap: "wrap" };
  const filterBtnBase = { padding: "8px 16px", borderRadius: "20px", border: "1px solid var(--border)", cursor: "pointer", fontSize: "14px", fontWeight: 600, backgroundColor: "var(--surface)", color: "var(--text-secondary)", transition: "all 0.2s" };
  const filterBtnActive = {
    ...filterBtnBase,
    backgroundColor: "var(--primary)",
    color: "var(--primary-contrast)",
    border: "1px solid var(--primary)",
  };
  const card = { backgroundColor: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 1px 3px var(--shadow)", overflow: "hidden", marginBottom: "20px" };
  const cardHeader = { backgroundColor: "var(--bg-secondary)", padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" };
  const orderIdStyle = { fontFamily: "monospace", fontWeight: "bold", color: "var(--text-primary)", fontSize: "0.95rem" };
  const totalStyle = { fontWeight: 800, fontSize: "16px", color: "var(--text-primary)" };
  const cardBody = { padding: "20px 24px" };
  const storeNameStyle = { fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", display: "flex", alignItems: "center", marginBottom: "12px" };
  const productRow = { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" };
  const thumbnailPlaceholder = { width: "52px", height: "52px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" };
  const itemNameStyle = { fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
  const qtyBadge = { backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)", borderRadius: "999px", padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 };
  const itemSubtotal = { fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" };
  const cardFooter = { display: "flex", justifyContent: "flex-end", gap: "12px", padding: "16px 24px", borderTop: "1px solid var(--border)", flexWrap: "wrap" };
  const btnPrimary = { backgroundColor: "var(--primary)", color: "var(--primary-contrast)", padding: "10px 18px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px" };
  const btnSecondary = { backgroundColor: "var(--surface)", color: "var(--text-secondary)", padding: "10px 18px", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600, fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px" };
  const statusBadgeBase = { padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 };

  if (loading) return <div style={{ padding: "3rem", color: "var(--text-secondary)", textAlign: "center" }}>Loading orders...</div>;
  if (orders.length === 0) {
    return (
      <div style={pageBg}>
        <div style={{ ...container, textAlign: "center", paddingTop: "80px" }}>
          <h2 style={heading}>No orders yet</h2>
          <p style={{ color: "var(--text-secondary)" }}>When you place an order, it will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageBg}>
      <div style={container}>
        <h2 style={heading}>YOUR ORDERS</h2>

        <div style={filterRow}>
          {filterCategories.map(cat => (
            <button
              key={cat}
              style={activeFilter === cat ? filterBtnActive : filterBtnBase}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredOrders.map(order => {
          const displayStatus = getDisplayStatus(order);
          const badgeStyle = getStatusBadgeStyle(displayStatus);
          const firstStore = order.sellerOrders?.[0]?.store?.name || "Unknown";
          return (
            <div style={card} key={order._id}>
              <div style={cardHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span style={orderIdStyle}>
                    Order #{order._id.slice(0, 8).toUpperCase()}
                  </span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ ...statusBadgeBase, ...badgeStyle }}>
                    {displayStatus}
                  </span>
                  <span style={totalStyle}>PKR {order.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div style={cardBody}>
                <div style={storeNameStyle}>
                  <StoreIcon />
                  {firstStore}
                </div>
                {(order.sellerOrders || []).flatMap(so =>
                  (so.items || []).map((item, idx) => (
                    <div style={productRow} key={`${so._id}-${idx}`}>
                      <div style={thumbnailPlaceholder}>
                        <PackageIcon />
                      </div>
                      <span style={itemNameStyle}>{item.productNameSnapshot}</span>
                      <span style={qtyBadge}>x{item.quantity}</span>
                      <span style={itemSubtotal}>
                        PKR {(item.unitPriceSnapshot * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div style={cardFooter}>
                <Link to={`/orders/${order._id}`} style={{ textDecoration: "none" }}>
                  <button style={btnPrimary}>
                    View Details
                  </button>
                </Link>
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "16px" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{ ...btnSecondary, opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              style={{ ...btnSecondary, opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
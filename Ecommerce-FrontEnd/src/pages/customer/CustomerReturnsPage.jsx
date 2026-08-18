import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";
import CustomerReturnDetail from "./CustomerReturnDetail";
import { getStatusBadgeStyle } from "../../utils/statusBadge";
import Pagination from "../../components/common/Pagination";

const getStatusLabel = (status) => {
  const labels = { PENDING_ADMIN_REVIEW: "Under Admin Review", REJECTED_BY_ADMIN: "Request Rejected", PENDING_SELLER_REVIEW: "Awaiting Seller Review", APPROVED_PENDING_SHIPMENT: "Action Required: Ship Item", REJECTED_BY_SELLER: "Declined by Seller", ITEM_IN_TRANSIT: "Return In Transit", SELLER_RECEIVED: "Received by Seller", INSPECTED_AND_REFUNDED: "Refund Completed" };
  return labels[status] || status;
};
const getStatusStyle = getStatusBadgeStyle;

const CustomerReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(returns.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReturns = returns.slice(startIndex, startIndex + itemsPerPage);

  const fetchReturns = async () => { setLoading(true); try { const res = await axiosInstance.get("/returns/mine"); setReturns(res.data?.data || res.data || []); } catch (err) { console.error("Failed to load returns", err); } finally { setLoading(false); } };

  useEffect(() => { fetchReturns(); }, []);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [returns.length, currentPage, totalPages]);

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>Loading returns...</div>;

  if (returns.length === 0) return <div style={{ padding: "4rem 1rem", textAlign: "center", color: "var(--text-secondary)" }}><h3 style={{ fontWeight: 600 }}>No return requests found</h3><p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>Your submitted returns and refund updates will appear here.</p></div>;

  return (
    <div style={{ maxWidth: "850px", margin: "2rem auto", padding: "0 1rem", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Your Returns</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "2rem" }}>Track and manage your return requests and refunds</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {currentReturns.map((ret) => {
          const badgeStyle = getStatusStyle(ret.status);
          const label = getStatusLabel(ret.status);
          const productImage = ret.product?.images?.[0];
          return (
            <div key={ret._id} onClick={() => setSelectedReturn(ret)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", cursor: "pointer", display: "flex", gap: "1rem", alignItems: "center", transition: "box-shadow 0.2s, border-color 0.2s", position: "relative" }} onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px var(--shadow)")} onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
              <div style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "var(--bg-secondary)" }}>
                {productImage ? <img src={getImageUrl(productImage)} alt={ret.product?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}><svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>Return #{ret.returnNumber || ret._id.slice(-8)}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "2px" }}>{ret.product?.name || "Product"} · {ret.reason}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "4px" }}>{new Date(ret.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ ...badgeStyle, whiteSpace: "nowrap", position: "absolute", top: "1rem", right: "1rem" }}>{label}</div>
            </div>
          );
        })}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {selectedReturn && <CustomerReturnDetail returnReq={selectedReturn} onClose={() => setSelectedReturn(null)} onUpdate={fetchReturns} />}
    </div>
  );
};

export default CustomerReturnsPage;
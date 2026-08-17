import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { getStatusBadgeStyle } from "../../utils/statusBadge";

const getStatusLabel = (status) => {
  const labels = { PENDING_ADMIN_REVIEW: "Under Admin Review", REJECTED_BY_ADMIN: "Request Rejected", PENDING_SELLER_REVIEW: "Awaiting Seller Review", APPROVED_PENDING_SHIPMENT: "Action Required: Ship Item", REJECTED_BY_SELLER: "Declined by Seller", ITEM_IN_TRANSIT: "Return In Transit", SELLER_RECEIVED: "Received by Seller", INSPECTED_AND_REFUNDED: "Refund Completed" };
  return labels[status] || status;
};

const getStatusStyle = getStatusBadgeStyle;

const ReturnHistoryPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Frontend-only pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(returns.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReturns = returns.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const res = await axiosInstance.get("/returns/mine");
        setReturns(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Failed to load returns", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [returns.length, currentPage, totalPages]);

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading returns...</div>;
  if (returns.length === 0) return <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem", textAlign: "center" }}><h3>No returns yet</h3><p style={{ color: "var(--text-secondary)" }}>You haven't requested any returns.</p></div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>My Returns</h2>

      {currentReturns.map((ret) => {
        const badgeStyle = getStatusStyle(ret.status);
        const label = getStatusLabel(ret.status);
        return (
          <Link to={`/returns/${ret._id}`} key={ret._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", border: "1px solid var(--border)", borderRadius: "12px", marginBottom: "0.75rem", textDecoration: "none", color: "var(--text-primary)", transition: "box-shadow 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 8px var(--shadow)"} onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
            <div>
              <div style={{ fontWeight: 600 }}>{ret.productName || ret.product?.name || "Deleted Product"}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Reason: {ret.reason}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{new Date(ret.createdAt).toLocaleDateString()}</div>
            </div>
            <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600, backgroundColor: badgeStyle.backgroundColor, color: badgeStyle.color }}>{label}</span>
          </Link>
        );
      })}

      {returns.length > itemsPerPage && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
          <button
            className="page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReturnHistoryPage;
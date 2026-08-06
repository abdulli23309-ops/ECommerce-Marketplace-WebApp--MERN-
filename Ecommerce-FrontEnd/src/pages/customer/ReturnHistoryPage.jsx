import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

const ReturnHistoryPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const res = await axiosInstance.get("/returns/my");
        setReturns(res.data || []);
      } catch (err) {
        console.error("Failed to load returns", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading returns...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h2 className="section-title">My Returns</h2>
      {returns.length === 0 ? (
        <div className="empty-state">
          <p>You haven't requested any returns.</p>
        </div>
      ) : (
        <div className="reviews-list">
          {returns.map((ret) => (
            <Link
              to={`/returns/${ret.id}`}
              key={ret.id}
              className="review-card-link"
              style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: "1.5rem", borderBottom: "1px solid #eaeaea", paddingBottom: "1rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 600, color: "#000", margin: 0 }}>
                    {ret.productName || "Deleted Product"}
                  </p>
                  <p style={{ color: "#666", fontSize: "0.85rem", margin: "0.25rem 0" }}>
                    Reason: {ret.reason}
                  </p>
                </div>
                <span style={{ fontWeight: 600, color: ret.status === "Approved" ? "#000" : "#666" }}>
                  {ret.status}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.5rem" }}>
                {new Date(ret.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReturnHistoryPage;
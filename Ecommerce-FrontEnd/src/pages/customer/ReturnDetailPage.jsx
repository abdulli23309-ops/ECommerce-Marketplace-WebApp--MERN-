import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import CustomerReturnDetail from "./CustomerReturnDetail";

const ReturnDetailsPage = () => {
  const { returnId } = useParams();
  const [returnReq, setReturnReq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturn = async () => {
      try {
        const res = await axiosInstance.get(`/returns/${returnId}`);
        setReturnReq(res.data?.data || res.data);
      } catch (err) {
        console.error("Failed to load return", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturn();
  }, [returnId]);

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading return...</div>;
  if (!returnReq) return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Return not found.</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "0 1rem" }}>
      <Link to="/returns" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", display: "inline-block", marginBottom: "1rem" }}>
        ← Back to returns
      </Link>
      {/* Render the detail directly, not as a modal */}
      <CustomerReturnDetail
        returnReq={returnReq}
        onClose={() => window.history.back()}
        onUpdate={() => window.location.reload()} // or refetch
      />
    </div>
  );
};

export default ReturnDetailsPage;

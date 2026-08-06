import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") || "";
  return `${base}${url}`;
};

const ReturnDetailPage = () => {
  const { returnId } = useParams();
  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturn = async () => {
      try {
        const res = await axiosInstance.get(`/returns/${returnId}`);
        setReturnData(res.data);
      } catch (err) {
        console.error("Failed to load return", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturn();
  }, [returnId]);

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading return details...</div>;
  if (!returnData) return <div style={{ padding: "2rem", color: "#666" }}>Return not found.</div>;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem" }}>
      <Link to="/returns/my" className="back-link">← Back to returns</Link>
      <h2 className="section-title">Return Request</h2>
      <div className="order-card" style={{ padding: "1.5rem", border: "1px solid #eaeaea", borderRadius: "0.5rem", background: "#fff" }}>
        <p><strong>Product:</strong> {returnData.productName}</p>
        <p><strong>Reason:</strong> {returnData.reason}</p>
        {returnData.description && <p><strong>Details:</strong> {returnData.description}</p>}
        <p><strong>Status:</strong> <span style={{ fontWeight: 600 }}>{returnData.status}</span></p>
        <p><strong>Requested:</strong> {new Date(returnData.createdAt).toLocaleDateString()}</p>

        {returnData.images?.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <h4>Attached Images</h4>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {returnData.images.map((img, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(img.imageUrl)}
                  alt={`Return ${idx + 1}`}
                  style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "0.25rem", border: "1px solid #eaeaea" }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnDetailPage;
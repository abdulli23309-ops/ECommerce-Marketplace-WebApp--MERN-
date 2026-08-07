import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") || "";
  return `${base}${url}`;
};

const ReviewDetailPage = () => {
  const { reviewId } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await axiosInstance.get(`/reviews/${reviewId}`);
        // res.data is the ApiResponse envelope; the actual review is in res.data.data
        setReview(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to load review", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [reviewId]);

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading review...</div>;
  if (!review) return <div style={{ padding: "2rem", color: "#666" }}>Review not found.</div>;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem" }}>
      <Link to="/reviews/my" className="back-link">← Back to reviews</Link>
      <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Review Details</h2>

      <div className="review-card" style={{ border: "1px solid #eaeaea", borderRadius: "0.5rem", padding: "1.5rem", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <p style={{ fontWeight: 600, color: "#000", margin: 0 }}>
              {review.product?.name || "Deleted Product"}
            </p>
            {/* No orderId on review; remove the fake link entirely */}
          </div>
          <span style={{ fontSize: "1.5rem", letterSpacing: "2px" }}>
            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
          </span>
        </div>

        {review.comment ? (
          <p style={{ margin: "0 0 1rem 0", color: "#333", lineHeight: 1.6 }}>{review.comment}</p>
        ) : (
          <p style={{ margin: "0 0 1rem 0", color: "#999", fontStyle: "italic" }}>No comment provided.</p>
        )}

        {review.images?.length > 0 && (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {review.images.map((imgUrl, idx) => (
              <img
                key={idx}
                src={getImageUrl(imgUrl)}   // imgUrl is a string, not an object
                alt={`Review image ${idx + 1}`}
                style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "0.25rem", border: "1px solid #eaeaea" }}
              />
            ))}
          </div>
        )}

        <p style={{ fontSize: "0.85rem", color: "#888", margin: 0 }}>
          Reviewed on {new Date(review.createdAt).toLocaleDateString()} at {new Date(review.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ReviewDetailPage;
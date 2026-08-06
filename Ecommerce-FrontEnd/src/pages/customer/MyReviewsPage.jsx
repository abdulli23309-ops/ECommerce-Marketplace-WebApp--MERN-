import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") || "";
  return `${base}${url}`;
};

const MyReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axiosInstance.get("/reviews/my");
        setReviews(res.data || []);
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading reviews...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h2 className="section-title">My Reviews</h2>

      {reviews.length === 0 ? (
        <div style={{ color: "#666", textAlign: "center", marginTop: "2rem" }}>
          <p>You haven't written any reviews yet.</p>
          <p style={{ marginTop: "1rem" }}>
            <Link
              to="/orders"
              style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                textDecoration: "none",
                color: "#fff",
                background: "#000",
                borderRadius: "0.25rem",
                fontWeight: 600,
              }}
            >
              View My Orders
            </Link>
          </p>
          <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#888" }}>
            Reviews can be written after your order has been delivered.
          </p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <Link
              to={`/reviews/${review.id}`}
              key={review.id}
              className="review-card-link"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #eaeaea",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 600, color: "#000", margin: 0 }}>
                    {review.productName || "Deleted Product"}
                  </p>
                  {review.orderId && (
                    <span style={{ fontSize: "0.8rem", textDecoration: "underline", color: "#666" }}>
                      View Order
                    </span>
                  )}
                </div>
                <span className="review-rating" style={{ fontSize: "1.25rem", letterSpacing: "2px" }}>
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </span>
              </div>

              {review.comment && (
                <p style={{ margin: "0.5rem 0", color: "#333" }}>{review.comment}</p>
              )}

              {review.images?.length > 0 && (
                <div className="review-images" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {review.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(img.imageUrl)}
                      alt={`Review ${idx + 1}`}
                      style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "0.25rem", border: "1px solid #eaeaea" }}
                    />
                  ))}
                </div>
              )}

              <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.5rem" }}>
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
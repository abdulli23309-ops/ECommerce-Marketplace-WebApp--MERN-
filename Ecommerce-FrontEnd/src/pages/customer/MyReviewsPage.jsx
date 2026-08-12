import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchMyReviews } from "../../services/reviewService";
import { getImageUrl } from "../../utils/imageHelper";

// Golden star SVG component
const StarIcon = ({ filled }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? "#f59e0b" : "none"}
    stroke="#f59e0b"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const StarRating = ({ rating, max = 5 }) => (
  <div style={{ display: "flex", gap: "2px" }}>
    {Array.from({ length: max }, (_, i) => (
      <StarIcon key={i} filled={i < Math.round(rating)} />
    ))}
  </div>
);

const MyReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchMyReviews({ page, pageSize: 10 });
        setReviews(res.items || []);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  if (loading)
    return <div style={{ padding: "2rem", color: "#666", textAlign: "center" }}>Loading reviews...</div>;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "2rem" }}>My Reviews</h2>

      {reviews.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b7280", padding: "3rem" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>You haven't written any reviews yet.</p>
          <Link to="/orders" style={{ color: "#111827", fontWeight: 600, textDecoration: "underline" }}>
            View My Orders
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {reviews.map((review) => (
            <Link
              to={`/reviews/${review._id}`}
              key={review._id}
              style={{
                textDecoration: "none",
                color: "inherit",
                background: "#fff",
                border: "1px solid #f3f4f6",
                borderRadius: "16px",
                padding: "1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                transition: "box-shadow 0.2s",
                display: "block",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)")}
            >
              {/* Header with product thumbnail and date */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                {/* Product image – if available, else placeholder */}
                <div style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", background: "#f3f4f6", flexShrink: 0 }}>
                  {review.product?.images?.[0] ? (
                    <img
                      src={getImageUrl(review.product.images[0])}
                      alt={review.product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: "1rem", margin: 0 }}>
                    {review.product?.name || "Deleted Product"}
                  </p>
                  <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "2px" }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {/* Star rating */}
                <StarRating rating={review.rating} />
              </div>

              {/* Review comment */}
              {review.comment && (
                <p style={{ color: "#374151", lineHeight: 1.6, margin: "0 0 0.75rem", fontSize: "0.95rem" }}>
                  {review.comment}
                  {review.sellerReply && (
  <div style={{
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderLeft: '4px solid #10b981',
    borderRadius: '4px'
  }}>
    <strong style={{
      display: 'block',
      fontSize: '13px',
      color: '#374151',
      marginBottom: '4px'
    }}>
      Response from Seller
    </strong>
    <p style={{
      margin: 0,
      fontSize: '14px',
      color: '#4b5563'
    }}>
      {review.sellerReply}
    </p>
  </div>
)}
                </p>
                
              )}

              {/* Review images */}
              {review.images?.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {review.images.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(imgUrl)}
                      alt={`Review ${idx + 1}`}
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        cursor: "pointer",
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "#6b7280" }}>
            Page {page} of {totalPages}
          </span>
          <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
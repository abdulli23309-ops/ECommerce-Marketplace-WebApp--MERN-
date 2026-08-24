import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchMyReviews } from "../../services/reviewService";
import { getImageUrl } from "../../utils/imageHelper";

// Golden star SVG component
const StarIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const StarRating = ({ rating, max = 5 }) => (
  <div style={{ display: "flex", gap: "2px" }}>
    {Array.from({ length: max }, (_, i) => <StarIcon key={i} filled={i < Math.round(rating)} />)}
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

  if (loading) return (
    <div className="my-reviews-container animate-fade-in" style={{ maxWidth: "900px", margin: "0 auto", padding: '2rem' }}>
      <div className="skeleton" style={{ height: "40px", width: "200px", marginBottom: "2rem", borderRadius: "8px" }}></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="modern-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <div className="skeleton" style={{ width: "56px", height: "56px", borderRadius: "8px" }}></div>
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: "20px", marginBottom: "0.5rem", width: "70%" }}></div>
              <div className="skeleton" style={{ height: "20px", width: "40%" }}></div>
            </div>
          </div>
          <div className="skeleton" style={{ height: "60px", marginBottom: "0.5rem" }}></div>
          <div className="skeleton" style={{ height: "20px", width: "80%" }}></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="my-reviews-container animate-fade-in" style={{ maxWidth: "900px", margin: "0 auto", padding: '2rem' }}>
      <div className="page-header">
        <h1 className="text-heading">✍️ My Reviews</h1>
        <p className="text-subtext">Your honest feedback helps other shoppers make informed decisions.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="empty-state-modern">
          <div className="empty-state-icon">
            <svg width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: "0 auto" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3>Nothing here yet</h3>
          <p>You haven't written any reviews yet. Share your experience to help others!</p>
          <Link to="/products" className="btn-primary" style={{ padding: "0.75rem 2rem", borderRadius: "99px", textDecoration: "none", display: "inline-block", marginTop: "1rem" }}>
            🛍️ Shop Products
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {reviews.map((review) => (
            <Link
              to={`/reviews/${review._id}`}
              key={review._id}
              className="review-list-item"
            >
              <div className="review-header-compact">
                {review.product?.images?.[0] ? (
                  <img src={getImageUrl(review.product.images[0])} alt={review.product.name} onError={(e) => (e.target.style.display = "none")} />
                ) : (
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "8px",
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 600, fontSize: "1.05rem", margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
                    {review.product?.name || "Deleted Product"}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <StarRating rating={review.rating} />
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      • {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {review.comment && (
                <div className="review-quote">
                  "{review.comment}"
                </div>
              )}

              {review.images?.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                  {review.images.slice(0, 4).map((imgUrl, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img
                        src={getImageUrl(imgUrl)}
                        alt={`Review ${idx + 1}`}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          transition: "transform 0.2s",
                        }}
                        onError={(e) => (e.target.style.display = "none")}
                        onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                      />
                      {idx === 3 && review.images.length > 4 && (
                        <div style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0, 0, 0, 0.6)",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "1.25rem",
                          fontWeight: 700,
                        }}>
                          +{review.images.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {review.sellerReply && (
                <div className="seller-response-block">
                  <strong>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                    </svg>
                    Seller Response
                  </strong>
                  <p>{review.sellerReply}</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{
              padding: "0.65rem 1.5rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: page <= 1 ? "var(--disabled-bg)" : "var(--surface)",
              color: page <= 1 ? "var(--disabled-text)" : "var(--text-primary)",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{
              padding: "0.65rem 1.5rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: page >= totalPages ? "var(--disabled-bg)" : "var(--surface)",
              color: page >= totalPages ? "var(--disabled-text)" : "var(--text-primary)",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;

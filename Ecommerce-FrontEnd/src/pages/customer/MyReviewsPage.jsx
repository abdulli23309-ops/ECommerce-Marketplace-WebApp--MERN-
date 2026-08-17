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

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-secondary)", textAlign: "center" }}>Loading reviews...</div>;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "2rem" }}>My Reviews</h2>

      {reviews.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "3rem" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>You haven't written any reviews yet.</p>
          <Link to="/orders" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "underline" }}>View My Orders</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {reviews.map((review) => (
            <Link
              to={`/reviews/${review._id}`}
              key={review._id}
              style={{
                textDecoration: "none", color: "inherit", background: "var(--surface)",
                border: "1px solid var(--border)", borderRadius: "16px", padding: "1.25rem",
                boxShadow: "0 1px 3px var(--shadow)", transition: "box-shadow 0.2s", display: "block",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px var(--shadow)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px var(--shadow)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", background: "var(--bg-secondary)", flexShrink: 0 }}>
                  {review.product?.images?.[0] ? (
                    <img src={getImageUrl(review.product.images[0])} alt={review.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => (e.target.style.display = "none")} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: "1rem", margin: 0 }}>{review.product?.name || "Deleted Product"}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <StarRating rating={review.rating} />
              </div>

              {review.comment && (
                <p style={{ color: "var(--text-primary)", lineHeight: 1.6, margin: "0 0 0.75rem", fontSize: "0.95rem" }}>{review.comment}</p>
              )}

              {review.sellerReply && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--success)', borderRadius: '4px' }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>Response from Seller</strong>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{review.sellerReply}</p>
                </div>
              )}

              {review.images?.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {review.images.map((imgUrl, idx) => (
                    <img key={idx} src={getImageUrl(imgUrl)} alt={`Review ${idx + 1}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")} onError={(e) => (e.target.style.display = "none")} />
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Page {page} of {totalPages}</span>
          <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
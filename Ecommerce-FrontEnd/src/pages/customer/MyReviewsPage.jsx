import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchMyReviews } from "../../services/reviewService";
import { getImageUrl } from "../../utils/imageHelper";

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

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading reviews...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h2 className="section-title">My Reviews</h2>

      {reviews.length === 0 ? (
        <div style={{ color: "#666", textAlign: "center", marginTop: "2rem" }}>
          <p>You haven't written any reviews yet.</p>
          <p style={{ marginTop: "1rem" }}>
            <Link to="/orders" style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              textDecoration: "none",
              color: "#fff",
              background: "#000",
              borderRadius: "0.25rem",
              fontWeight: 600,
            }}>
              View My Orders
            </Link>
          </p>
          <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#888" }}>
            Reviews can be written after your order has been delivered.
          </p>
        </div>
      ) : (
        <>
          <div className="reviews-list">
            {reviews.map((review) => (
              <Link
                to={`/reviews/${review._id}`}
                key={review._id}
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
                      {review.product?.name || "Deleted Product"}
                    </p>
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
                    {review.images.map((imgUrl, idx) => (
                      <img
                        key={imgUrl || idx}
                        src={getImageUrl(imgUrl)}
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
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyReviewsPage;
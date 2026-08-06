import { useState, useEffect } from "react";
import { fetchStoreReviews } from "../../services/sellerReviewService";

const SellerReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await fetchStoreReviews(page, 10);
      const items = Array.isArray(data) ? data : data.items ?? [];
      setReviews(items);
      setTotalCount(data.totalCount ?? items.length);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page]);

  return (
    <div>
      <h2 className="section-title">Customer Reviews</h2>
      <p style={{ color: "#666", marginBottom: "2rem" }}>{totalCount} review{totalCount !== 1 ? "s" : ""} for your products</p>

      {loading ? (
        <p style={{ color: "#666" }}>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div className="empty-state">No reviews yet.</div>
      ) : (
        <>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.reviewId || review._id} className="review-card">
                <div className="review-header">
                  <span className="review-rating">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                  <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="review-comment">{review.comment}</p>
                <div className="review-meta">
                  <span className="review-product">Product: {review.productName}</span>
                  <span className="review-author">by {review.customerName}</span>
                </div>
                {review.imageUrls?.length > 0 && (
                  <div className="review-images" style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    {review.imageUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url.startsWith("http") ? url : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "")}${url}`}
                        alt="Review"
                        style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "0.25rem" }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SellerReviewsPage;
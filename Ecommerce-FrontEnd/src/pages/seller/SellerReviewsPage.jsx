import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";

const SellerReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/seller/reviews", { params: { page, pageSize: 10 } });
      const data = res.data?.data;
      setReviews(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [page]);

  return (
    <div>
      <h2 className="section-title">Customer Reviews</h2>
      {loading ? <p>Loading...</p> : reviews.length === 0 ? <p>No reviews yet.</p> : (
        <>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review._id} className="review-card" style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #eaeaea", borderRadius: "0.5rem" }}>
                <div><strong>{review.product?.name || "Deleted Product"}</strong></div>
                <div className="review-rating">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
                <p>{review.comment}</p>
                <p style={{ fontSize: "0.8rem", color: "#888" }}>by {review.customer?.name || "Anonymous"} on {new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
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

export default SellerReviewsPage;
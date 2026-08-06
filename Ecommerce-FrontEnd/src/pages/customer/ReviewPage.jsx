import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { addToCart } from "../../services/cartService"; // not needed, we'll use review service
// No existing review service function for create; we'll add it here inline

const ReviewPage = () => {
  const { orderItemId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await axiosInstance.post("/reviews", {
        orderItemId,
        rating,
        comment,
        imageUrls: [], // optional image upload can be added later
      });
      // Navigate to the order detail or product page? We don't have productId here. Go to order history.
      navigate("/orders");
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.message || "Failed to submit review.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      <h2 className="section-title">Write a Review</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Rating</label>
          <div style={{ display: "flex", gap: "0.5rem", fontSize: "1.5rem", cursor: "pointer" }}>
            {[1,2,3,4,5].map(star => (
              <span key={star} onClick={() => setRating(star)} style={{ color: star <= rating ? "#000" : "#ccc" }}>
                ★
              </span>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Comment (optional)</label>
          <textarea
            className="form-input"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewPage;
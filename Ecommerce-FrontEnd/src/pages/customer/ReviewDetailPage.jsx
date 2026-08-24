import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";

const StarIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const StarRating = ({ rating, max = 5 }) => (
  <div style={{ display: "flex", gap: "4px" }}>
    {Array.from({ length: max }, (_, i) => <StarIcon key={i} filled={i < Math.round(rating)} />)}
  </div>
);

const ReviewDetailPage = () => {
  const { reviewId } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await axiosInstance.get(`/reviews/${reviewId}`);
        setReview(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to load review", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [reviewId]);

  if (loading) return (
    <div className="review-detail-container animate-fade-in">
      <div className="skeleton" style={{ height: "30px", width: "120px", marginBottom: "2rem", borderRadius: "8px" }}></div>
      <div className="modern-card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
          <div className="skeleton" style={{ width: "80px", height: "80px", borderRadius: "12px" }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: "28px", marginBottom: "0.75rem", width: "70%" }}></div>
            <div className="skeleton" style={{ height: "24px", width: "40%" }}></div>
          </div>
        </div>
        <div className="skeleton" style={{ height: "80px", marginBottom: "1.5rem" }}></div>
        <div className="skeleton" style={{ height: "200px", marginBottom: "1rem" }}></div>
      </div>
    </div>
  );

  if (!review) return (
    <div className="review-detail-container animate-fade-in">
      <div className="empty-state-modern" style={{ maxWidth: "500px", margin: "4rem auto" }}>
        <div className="empty-state-icon">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3>Review not found</h3>
        <p>We couldn't find the review you're looking for.</p>
        <Link to="/reviews/my" className="btn-primary" style={{ padding: "0.75rem 2rem", borderRadius: "99px", textDecoration: "none", display: "inline-block" }}>
          Back to My Reviews
        </Link>
      </div>
    </div>
  );

  const imageCount = review.images?.length || 0;
  const galleryClass = imageCount === 1 ? 'count-1' : imageCount === 2 ? 'count-2' : imageCount === 3 ? 'count-3' : imageCount === 4 ? 'count-4' : 'count-5-plus';

  return (
    <div className="review-detail-container animate-fade-in">
      <Link
        to="/reviews/my"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--text-secondary)",
          textDecoration: "none",
          fontSize: "0.95rem",
          marginBottom: "2rem",
          transition: "color 0.2s",
          fontWeight: 500,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to reviews
      </Link>

      <div className="review-detail-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
            {review.product?.images?.length > 0 ? (
              <img
                src={getImageUrl(review.product.images[0])}
                alt={review.product.name}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "12px",
                  objectFit: "cover",
                  border: "2px solid var(--border)",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px var(--shadow)",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  border: "2px solid var(--border)",
                }}
              >
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.75rem", color: "var(--text-primary)" }}>
                {review.product?.name || "Deleted Product"}
              </h2>
              <StarRating rating={review.rating} />
            </div>
          </div>
          <div className="verified-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Verified Purchase
          </div>
        </div>

        {review.comment ? (
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              position: "relative",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="var(--text-muted)"
              style={{ position: "absolute", top: "1rem", left: "1rem", opacity: 0.3 }}
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p
              style={{
                color: "var(--text-primary)",
                lineHeight: 1.7,
                margin: 0,
                fontSize: "1.05rem",
                paddingLeft: "2.5rem",
                fontStyle: "italic",
              }}
            >
              {review.comment}
            </p>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontStyle: "italic", margin: "0 0 1.5rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px", textAlign: "center" }}>
            No written review provided.
          </p>
        )}

        {review.images?.length > 0 && (
          <div className={`review-image-gallery ${galleryClass}`}>
            {review.images.slice(0, 4).map((imgUrl, idx) => {
              const isLast = idx === 3 && review.images.length > 4;
              return (
                <div
                  key={idx}
                  className={isLast ? "image-overlay-count" : ""}
                  data-count={isLast ? `+${review.images.length - 4}` : undefined}
                >
                  <img
                    src={getImageUrl(imgUrl)}
                    alt={`Review image ${idx + 1}`}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {review.sellerReply && (
          <div className="seller-response-block" style={{ marginTop: "1.5rem" }}>
            <strong>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
              </svg>
              Seller Response
            </strong>
            <p>{review.sellerReply}</p>
          </div>
        )}

        <div
          style={{
            borderTop: "2px solid var(--border)",
            paddingTop: "1.5rem",
            marginTop: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", verticalAlign: "middle", marginRight: "0.5rem" }}>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Reviewed on{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {new Date(review.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </strong>
            {" at "}
            {new Date(review.createdAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <Link
            to={`/products/${review.product?._id}`}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "8px",
              background: "var(--primary)",
              color: "var(--primary-contrast)",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 600,
              transition: "all 0.2s",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px var(--shadow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            View Product
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;

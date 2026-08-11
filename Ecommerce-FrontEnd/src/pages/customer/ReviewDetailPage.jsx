import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
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

  if (loading)
    return <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>Loading review...</div>;
  if (!review)
    return <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>Review not found.</div>;

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      {/* Back link with arrow icon */}
      <Link
        to="/reviews/my"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          color: "#6b7280",
          textDecoration: "none",
          fontSize: "0.9rem",
          marginBottom: "1.5rem",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.color = "#111827")}
        onMouseLeave={(e) => (e.target.style.color = "#6b7280")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to reviews
      </Link>

      <div
        style={{
          background: "#fff",
          border: "1px solid #f3f4f6",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        {/* Product name + star rating + verified badge */}
        {/* Product name + star rating + verified badge */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
    {/* Product thumbnail */}
    {review.product?.images?.length > 0 ? (
      <img
        src={getImageUrl(review.product.images[0])}
        alt={review.product.name}
        style={{
          width: 64,
          height: 64,
          borderRadius: "8px",
          objectFit: "cover",
          border: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    ) : (
      <div style={{
        width: 64, height: 64,
        borderRadius: "8px",
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#9ca3af",
        flexShrink: 0,
      }}>
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )}
    <div>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
        {review.product?.name || "Deleted Product"}
      </h2>
      <StarRating rating={review.rating} />
    </div>
  </div>
  {/* Verified Purchase badge */}
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      background: "#ecfdf5",
      color: "#065f46",
      padding: "3px 10px",
      borderRadius: "999px",
      fontSize: "0.75rem",
      fontWeight: 600,
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    Verified Purchase
  </span>
</div>

        {/* Review comment */}
        {review.comment ? (
          <p style={{ color: "#374151", lineHeight: 1.7, margin: "0 0 1.5rem", fontSize: "1rem" }}>
            {review.comment}
          </p>
        ) : (
          <p style={{ color: "#9ca3af", fontStyle: "italic", margin: "0 0 1.5rem" }}>No comment provided.</p>
        )}

        {/* Review images with error fallback */}
        {review.images?.length > 0 && (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {review.images.map((imgUrl, idx) => (
              <img
                key={idx}
                src={getImageUrl(imgUrl)}
                alt={`Review image ${idx + 1}`}
                style={{
                  maxWidth: "200px",
                  height: "160px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  // Optionally insert a placeholder
                  const parent = e.target.parentNode;
                  if (!parent.querySelector(".fallback")) {
                    const div = document.createElement("div");
                    div.className = "fallback";
                    div.style.cssText = "width:200px;height:160px;background:#f3f4f6;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#9ca3af;";
                    div.innerHTML = `<svg width="32" height="32" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
                    parent.appendChild(div);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Footer date */}
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "1rem", color: "#9ca3af", fontSize: "0.85rem" }}>
          Reviewed on {new Date(review.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          {" at "}
          {new Date(review.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;
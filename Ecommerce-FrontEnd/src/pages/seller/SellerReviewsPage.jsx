import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";

const StarIcon = ({ filled, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "var(--warning)" : "var(--border)"}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ReplyIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12' font-family='sans-serif'%3ENo Img%3C/text%3E%3C/svg%3E";

const styles = {
  page: { padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)", maxWidth: "1200px", margin: "0 auto" },
  header: { fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--text-primary)" },
  subHeader: { color: "var(--text-secondary)", marginBottom: "2rem" },
  analyticsCard: {
    background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", padding: "1.5rem",
    display: "flex", gap: "2rem", marginBottom: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  analyticsItem: { display: "flex", alignItems: "center", gap: "0.75rem" },
  analyticsLabel: { fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500 },
  analyticsValue: { fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" },
  toolbar: { display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" },
  select: { padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--input-border)", fontSize: "0.85rem", background: "var(--input-bg)", color: "var(--text-primary)" },
  reviewCard: {
    background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)",
    padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
  },
  reviewerRow: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" },
  avatar: (initial) => ({
    width: "36px", height: "36px", borderRadius: "50%", background: "var(--primary)", color: "var(--primary-contrast)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 600, fontSize: "0.9rem"
  }),
  productThumb: { width: "48px", height: "48px", borderRadius: "6px", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" },
  goldStarRow: { display: "flex", gap: "2px", marginBottom: "0.5rem" },
  comment: { color: "var(--text-primary)", lineHeight: 1.5, marginBottom: "0.75rem" },
  imageGallery: { display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" },
  thumbPreview: { width: "64px", height: "64px", borderRadius: "6px", objectFit: "cover", cursor: "pointer", border: "1px solid var(--border)" },
  replyBox: { marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "var(--bg-secondary)", borderRadius: "6px", border: "1px solid var(--border)" },
  actionBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)", padding: "4px 8px", borderRadius: "4px" },
  lightboxOverlay: {
    position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer"
  },
  lightboxImage: { maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" },
  pagination: { display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem", alignItems: "center" },
  pageBtn: { padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 500, color: "var(--text-primary)" }
};

const SellerReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("newest");
  const [filter, setFilter] = useState("all");

  const [replyText, setReplyText] = useState({});
  const [replyingId, setReplyingId] = useState(null);

  const [lightboxImage, setLightboxImage] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/seller/reviews", {
        params: { page, pageSize: 10, sort, filter }
      });
      const data = res.data?.data;
      const items = data.items || [];
      setReviews(items);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [page, sort, filter]);

  const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;
  const totalReviewsCount = reviews.length;

  const handleReplySubmit = async (reviewId) => {
    if (!replyText[reviewId]?.trim()) return;
    try {
      await axiosInstance.put(`/seller/reviews/${reviewId}/reply`, { replyText: replyText[reviewId] });
      setReplyText(prev => ({ ...prev, [reviewId]: "" }));
      setReplyingId(null);
      fetchReviews();
    } catch (err) {
      console.error("Failed to submit reply", err);
    }
  };

  const openLightbox = (imgUrl) => setLightboxImage(imgUrl);
  const closeLightbox = () => setLightboxImage(null);

  const getProductImage = (review) => {
    if (review.product?.images?.length > 0) {
      return getImageUrl(review.product.images[0]);
    }
    return PLACEHOLDER_IMAGE;
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.header}>Customer Reviews</h2>
      <p style={styles.subHeader}>View and manage reviews for your products.</p>

      <div style={styles.analyticsCard}>
        <div style={styles.analyticsItem}>
          <svg width="28" height="28" fill="var(--warning)" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <div>
            <div style={styles.analyticsLabel}>Average Rating</div>
            <div style={styles.analyticsValue}>{avgRating.toFixed(1)} / 5</div>
          </div>
        </div>
        <div style={styles.analyticsItem}>
          <svg width="28" height="28" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
          <div>
            <div style={styles.analyticsLabel}>Total Reviews</div>
            <div style={styles.analyticsValue}>{totalReviewsCount}</div>
          </div>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <select style={styles.select} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
          <select style={styles.select} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Reviews</option>
            <option value="replied">Replied</option>
            <option value="unreplied">Unreplied</option>
          </select>
        </div>
      </div>

      {loading ? <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading reviews...</p> :
       reviews.length === 0 ? <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>No reviews yet.</p> :
        reviews.map(review => (
          <div key={review._id} style={styles.reviewCard}>
            <div style={styles.reviewerRow}>
              <div style={styles.avatar(review.customer?.name?.charAt(0).toUpperCase())}>
                {review.customer?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{review.customer?.name || "Anonymous"}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                  {review.orderId && (
                    <span style={{ marginLeft: "0.5rem", color: "var(--info)", fontWeight: 500 }}>
                      · Order #{review.orderId.toString().slice(-8)}
                    </span>
                  )}
                </div>
              </div>
              <div style={styles.goldStarRow}>
                {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= review.rating} />)}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <img
                src={getProductImage(review)}
                alt={review.product?.name}
                style={styles.productThumb}
                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
              />
              <span style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--text-primary)" }}>{review.product?.name || "Deleted Product"}</span>
            </div>

            <p style={styles.comment}>{review.comment}</p>

            {review.images?.length > 0 && (
              <div style={styles.imageGallery}>
                {review.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`Review image ${idx+1}`}
                    style={styles.thumbPreview}
                    onClick={() => openLightbox(getImageUrl(img))}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ))}
              </div>
            )}

            {review.sellerReply && (
              <div style={styles.replyBox}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem", color: "var(--success-text)" }}>
                  ✅ Seller Reply
                </div>
                <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "0.9rem" }}>{review.sellerReply}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <button
                style={styles.actionBtn}
                onClick={() => setReplyingId(replyingId === review._id ? null : review._id)}
              >
                <ReplyIcon /> Reply
              </button>
            </div>

            {replyingId === review._id && (
              <div style={{ marginTop: "0.75rem" }}>
                <textarea
                  value={replyText[review._id] || ""}
                  onChange={e => setReplyText(prev => ({ ...prev, [review._id]: e.target.value }))}
                  rows={2}
                  placeholder="Write your public reply..."
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--input-border)", resize: "vertical", background: "var(--input-bg)", color: "var(--text-primary)" }}
                />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => handleReplySubmit(review._id)}
                    style={{ padding: "0.4rem 1rem", borderRadius: "6px", border: "none", background: "var(--primary)", color: "var(--primary-contrast)", fontWeight: 600, cursor: "pointer" }}
                  >
                    Submit Reply
                  </button>
                  <button
                    onClick={() => setReplyingId(null)}
                    style={{ padding: "0.4rem 1rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-primary)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      }

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Page {page} of {totalPages}</span>
          <button style={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {lightboxImage && (
        <div style={styles.lightboxOverlay} onClick={closeLightbox}>
          <img src={lightboxImage} alt="Full size" style={styles.lightboxImage} />
        </div>
      )}
    </div>
  );
};

export default SellerReviewsPage;
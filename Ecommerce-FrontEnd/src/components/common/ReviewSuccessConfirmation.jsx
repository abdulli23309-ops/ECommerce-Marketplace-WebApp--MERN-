import { Link, useLocation } from "react-router-dom";

/**
 * ReviewSuccessConfirmation
 *
 * Success page shown after a review is successfully created. It reads the
 * just-created review + product from navigation state (location.state) and
 * renders:
 *   1. A clear success message (communicated by text, not icon alone)
 *   2. A summary of exactly what was saved (product, rating, comment, visibility)
 *   3. A "how others will see it" preview
 *   4. An anonymous-privacy explanation when the review was posted anonymously
 *   5. CTA actions (View Product / View My Reviews / Back to Orders)
 *
 * Falls back gracefully when opened directly without navigation state (e.g. a
 * refresh or a deep link) instead of crashing on undefined fields.
 */
const ReviewSuccessConfirmation = (props = {}) => {
  const location = useLocation();
  const state = location.state || {};

  // Navigation state (the just-created review) takes precedence; fall back to the
  // legacy props API for direct/embedded usage.
  const review = state.review || null;
  const product = state.product || null;

  const hasData = !!(review || product);

  const productId =
    review?.product?._id || review?.product || product?.id || props.productId || null;
  const productName =
    product?.name || review?.product?.name || props.productName || "this item";
  const productImage = product?.image || null;
  const rating = Math.min(
    5,
    Math.max(0, Number(review?.rating ?? props.rating ?? 0) || 0)
  );
  const comment = review?.comment ?? props.reviewText;
  const isAnonymous = Boolean(
    review?.isAnonymous ?? props?.isAnonymous ?? false
  );

  const starCount = Math.min(5, Math.max(0, Number(rating) || 0));
  const reviewerLabel = isAnonymous ? "Anonymous Customer" : "Verified Customer";

  const renderStars = (count) => (
    <div
      role="img"
      aria-label={`Rated ${count} out of 5 stars`}
      style={{ display: "flex", justifyContent: "center", gap: "2px" }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ display: "block" }}
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i < count ? "#fbbf24" : "var(--surface-hover, #e5e7eb)"}
            stroke={i < count ? "#d97706" : "var(--border)"}
            strokeWidth="1"
          />
        </svg>
      ))}
    </div>
  );

  return (
    <div style={containerStyle}>
      {/* Success graphic (decorative; text below communicates the state) */}
      <div
          className="review-success-graphic"
          style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}
        >
          <div className="success-glow-ring" />
          <div style={iconBadgeStyle}>
          <svg className="success-checkmark" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </div>

      <h1 style={h1Style}>Review Submitted Successfully</h1>
      <p style={leadStyle}>Your review has been saved and will appear on the product page.</p>

      {/* ---- What was saved ---- */}
      <section aria-labelledby="summary-title" style={cardStyle}>
        <h2 id="summary-title" style={sectionTitleStyle}>YOUR REVIEW</h2>

        {hasData ? (
          <>
            {productImage && (
              <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
                <img
                  src={productImage}
                  alt={productName}
                  style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "10px", border: "1px solid var(--border)" }}
                />
              </div>
            )}
            <dl style={dlStyle}>
              <div style={rowStyle}>
                <dt style={dtStyle}>Product</dt>
                <dd style={ddStyle}>{productName}</dd>
              </div>
              <div style={rowStyle}>
                <dt style={dtStyle}>Rating</dt>
                <dd style={ddStyle}>{renderStars(starCount)}</dd>
              </div>
              {comment ? (
                <div style={rowStyle}>
                  <dt style={dtStyle}>Your review</dt>
                  <dd style={{ ...ddStyle, fontStyle: "italic", color: "var(--text-secondary)" }}>"{comment}"</dd>
                </div>
              ) : null}
              <div style={rowStyle}>
                <dt style={dtStyle}>Review visibility</dt>
                <dd style={ddStyle}>{isAnonymous ? "Anonymous" : "Public"}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            Review submission completed, but the saved review details are unavailable right now.
          </p>
        )}
      </section>
{/* ---- How others will see it ---- */}
      <section aria-labelledby="preview-title" style={cardStyle}>
        <h2 id="preview-title" style={sectionTitleStyle}>HOW OTHERS WILL SEE IT</h2>
        <div style={previewCardStyle}>
          {hasData ? (
            <>
              {renderStars(starCount)}
              {comment ? (
                <p style={{ margin: "0.75rem 0", fontStyle: "italic", color: "var(--text-primary)", textAlign: "center" }}>"{comment}"</p>
              ) : (
                <p style={{ margin: "0.75rem 0", color: "var(--text-secondary)", textAlign: "center" }}>No written comment.</p>
              )}
              <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)", textAlign: "center", fontSize: "0.9rem" }}>— {reviewerLabel}</p>
            </>
          ) : (
            <p style={{ margin: 0, color: "var(--text-secondary)", textAlign: "center" }}>
              Your review will be visible on the product page once details are available.
            </p>
          )}
        </div>
        <p style={{ margin: "0.9rem 0 0", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {isAnonymous
            ? "You posted anonymously, so your name is not shown. Other customers will see \u201cAnonymous Customer\u201d as the reviewer."
            : "Your review will appear with your normal reviewer identity, exactly as shown on the product page."}
        </p>
      </section>

      {/* ---- Actions ---- */}
      <nav aria-label="Post-review actions" style={actionsStyle}>
        {productId ? (
          <Link to={`/products/${productId}`} style={{ ...primaryButtonStyle, display: "flex" }}>
            View Product
          </Link>
        ) : (
          <Link to="/products" style={{ ...primaryButtonStyle, display: "flex" }}>
            Return to Products
          </Link>
        )}
        <Link to="/reviews/my" style={secondaryButtonStyle}>
          View My Reviews
        </Link>
        <Link to="/orders" style={ghostButtonStyle}>
          Back to Orders
        </Link>
      </nav>
    </div>
  );
};

// ---- Styles ---------------------------------------------------------------
// Inline-style objects are used intentionally (not CSS) because this component
// was authored inline-style and the parent files (index.css / design tokens)
// already expose the CSS variables these reference. Keeping them co-located
// with the component avoids a cascading redesign and guarantees the page still
// renders even if a stylesheet import fails.

const containerStyle = {
  maxWidth: "720px",
  width: "90%",
  margin: "3rem auto",
  padding: "2rem 1.5rem",
  color: "var(--text-primary)",
  animation: "review-fade-in 0.55s ease-out both",
};

const iconBadgeStyle = {
  width: "68px",
  height: "68px",
  borderRadius: "50%",
  background: "var(--primary)",
  boxShadow: "0 8px 22px color-mix(in srgb, var(--primary) 38%, transparent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const h1Style = {
  margin: "0.75rem 0 0.15rem",
  fontSize: "1.6rem",
  fontWeight: 700,
  textAlign: "center",
  color: "var(--text-primary)",
};

const leadStyle = {
  margin: "0 auto 1.75rem",
  fontSize: "0.95rem",
  textAlign: "center",
  color: "var(--text-secondary)",
  lineHeight: 1.5,
};

const cardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderTop: "2px solid var(--primary)",
  borderRadius: "14px",
  padding: "1.25rem 1.35rem",
  marginBottom: "1.25rem",
  boxShadow: "var(--shadow)",
};

const sectionTitleStyle = {
  margin: "0 0 1rem",
  fontSize: "0.85rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "var(--text-secondary)",
};

const dlStyle = {
  margin: 0,
  display: "grid",
  gap: "0.6rem",
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "110px 1fr",
  gap: "0.5rem 1rem",
  alignItems: "start",
};

const dtStyle = {
  margin: 0,
  fontSize: "0.82rem",
  color: "var(--text-secondary)",
  fontWeight: 600,
  textTransform: "capitalize",
};

const ddStyle = {
  margin: 0,
  fontSize: "0.95rem",
  fontWeight: 500,
  wordBreak: "break-word",
};

const previewCardStyle = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "1.15rem",
  textAlign: "center",
  marginBottom: "0.5rem",
};

const actionsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.7rem",
  justifyContent: "center",
  marginTop: "0.25rem",
};

const primaryButtonStyle = {
  flex: "1 1 180px",
  minWidth: "150px",
  padding: "0.7rem 1.1rem",
  fontSize: "0.92rem",
  fontWeight: 700,
  borderRadius: "9999px",
  border: "none",
  background: "var(--primary)",
  color: "var(--primary-contrast)",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px color-mix(in srgb, var(--primary) 28%, transparent)",
  transition: "all 0.18s ease",
};

const secondaryButtonStyle = {
  flex: "1 1 180px",
  minWidth: "150px",
  padding: "0.7rem 1.1rem",
  fontSize: "0.92rem",
  fontWeight: 600,
  borderRadius: "9999px",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-primary)",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.18s ease",
};

const ghostButtonStyle = {
  flex: "1 1 180px",
  minWidth: "150px",
  padding: "0.7rem 1.1rem",
  fontSize: "0.9rem",
  fontWeight: 600,
  borderRadius: "9999px",
  border: "1px solid transparent",
  background: "transparent",
  color: "var(--text-secondary)",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.18s ease",
};

export default ReviewSuccessConfirmation;

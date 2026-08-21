const baseStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.25rem 0.6rem",
  borderRadius: "6px",
  background: "rgba(16, 185, 129, 0.1)",
  border: "1px solid rgba(16, 185, 129, 0.25)",
  color: "#10b981",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.02em",
  width: "fit-content",
  whiteSpace: "nowrap",
};

/**
 * Elegant, minimalist "Free Delivery" micro-badge.
 * Uses an inline Feather/Lucide-style truck icon (no emoji, no extra package).
 * Pass `style` to tweak spacing per context (e.g. marginTop).
 */
const FreeDeliveryBadge = ({ style }) => (
  <span style={{ ...baseStyle, ...style }}>
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
    Free Delivery
  </span>
);

export default FreeDeliveryBadge;

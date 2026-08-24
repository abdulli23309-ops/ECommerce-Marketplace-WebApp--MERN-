const baseStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  padding: "0.25rem 0.65rem",
  borderRadius: "6px",
  background: "var(--success-bg)",
  color: "var(--success-text)",
  // Low-opacity tint of the token so the outline reads in both themes. Kept as
  // longhand: if color-mix() is unsupported the declaration is dropped and the
  // border falls back to currentColor (--success-text), still theme-correct.
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "color-mix(in srgb, var(--success-text) 25%, transparent)",
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

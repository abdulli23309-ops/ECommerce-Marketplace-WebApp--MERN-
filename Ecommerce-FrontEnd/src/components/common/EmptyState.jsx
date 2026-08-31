import React from "react";
import Button from "./Button";

// Custom premium illustrations with inline styling, colors, and gradients
const CartIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: "0 auto 1.5rem" }} className="sparkline-svg">
    <circle cx="60" cy="60" r="48" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M40 45h40v35a10 10 0 01-10 10H50a10 10 0 01-10-10V45z" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M50 45v-6a10 10 0 0120 0v6" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="50" cy="62" r="3" fill="var(--warning)" />
    <circle cx="70" cy="62" r="3" fill="var(--warning)" />
    <path d="M56 70h8" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" />
    {/* Sparkling particles */}
    <path d="M30 35l3 3M33 35l-3 3M90 40l2 2M92 40l-2 2M60 20l2 2M62 20l-2 2" stroke="var(--warning)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const WishlistIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: "0 auto 1.5rem" }} className="sparkline-svg">
    <circle cx="60" cy="60" r="48" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M60 82c-1.5-1.5-22-19-22-34 0-9 7.5-16.5 16.5-16.5 5.5 0 9.5 3 11.5 5.5 2-2.5 6-5.5 11.5-5.5 9 0 16.5 7.5 16.5 16.5 0 15-20.5 32.5-22 34z" fill="var(--surface)" stroke="var(--danger)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M32 30l2 2M34 30l-2 2M88 32l3 3M91 32l-3 3" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const OrdersIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: "0 auto 1.5rem" }} className="sparkline-svg">
    <circle cx="60" cy="60" r="48" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M42 40h36v40H42z" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M48 50h24M48 60h24M48 70h14" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" />
    <rect x="72" y="32" width="12" height="12" rx="6" fill="var(--info)" />
  </svg>
);

const ReviewsIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: "0 auto 1.5rem" }} className="sparkline-svg">
    <circle cx="60" cy="60" r="48" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M38 45h36v24H48l-8 8v-8H38V45z" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M82 53h-6v16H66v6l8 8v-8h8V53z" fill="var(--bg-primary)" stroke="var(--border)" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="48" cy="57" r="2" fill="var(--text-muted)" />
    <circle cx="56" cy="57" r="2" fill="var(--text-muted)" />
    <circle cx="64" cy="57" r="2" fill="var(--text-muted)" />
  </svg>
);

const ReturnsIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: "0 auto 1.5rem" }} className="sparkline-svg">
    <circle cx="60" cy="60" r="48" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M40 50h40v26H40z" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M50 50V38a6 6 0 0112 0v12" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" />
    <path d="M72 63l-6 6 6 6" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M66 69h12c4 0 6-2 6-5" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const DefaultIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: "0 auto 1.5rem" }} className="sparkline-svg">
    <circle cx="60" cy="60" r="48" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M42 42h36v36H42z" fill="var(--surface)" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="60" cy="60" r="8" fill="var(--bg-secondary)" stroke="var(--text-muted)" strokeWidth="2" />
  </svg>
);

const EmptyState = ({
  title = "Nothing here yet",
  body,
  ctaLabel,
  onCta,
  icon,
  variant = "default",
  style,
}) => {
  const renderIllustration = () => {
    if (icon) return <div className="vv-empty__icon">{icon}</div>;
    switch (variant) {
      case "cart":
        return <CartIllustration />;
      case "wishlist":
        return <WishlistIllustration />;
      case "orders":
        return <OrdersIllustration />;
      case "reviews":
        return <ReviewsIllustration />;
      case "returns":
        return <ReturnsIllustration />;
      default:
        return <DefaultIllustration />;
    }
  };

  return (
    <div className="vv-empty page-fade-slide" style={style}>
      {renderIllustration()}
      <div className="vv-empty__title" style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>{title}</div>
      {body && <p className="vv-empty__body" style={{ color: "var(--text-secondary)", marginBottom: "1.25rem" }}>{body}</p>}
      {ctaLabel && onCta && (
        <Button variant="primary" size="lg" onClick={onCta} className="vv-btn animate-fade-in" style={{ borderRadius: "8px" }}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
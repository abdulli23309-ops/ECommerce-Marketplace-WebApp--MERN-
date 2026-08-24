import { useState } from "react";

const PackageGlyph = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

/**
 * Square product thumbnail for order lines.
 *
 * Falls back to a package glyph when there is no image path *or* when the image
 * fails to load (stale upload, deleted file), so a broken-image icon is never
 * shown. Pass an already-resolved absolute URL — use getImageUrl() at the call
 * site.
 */
const ProductThumb = ({ src, alt, size = 48, radius = 6 }) => {
  const [failed, setFailed] = useState(false);

  const box = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: `${radius}px`,
    flexShrink: 0,
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    overflow: "hidden",
  };

  if (!src || failed) {
    return (
      <div
        style={{
          ...box,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
        }}
      >
        <PackageGlyph size={Math.round(size * 0.42)} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      loading="lazy"
      style={{ ...box, objectFit: "cover" }}
      onError={() => setFailed(true)}
    />
  );
};

export default ProductThumb;

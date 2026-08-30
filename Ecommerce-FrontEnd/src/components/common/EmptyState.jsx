import React from "react";
import Button from "./Button";

/**
 * Consistent empty-state block (UI-02). Use for every major empty-data
 * scenario instead of ad-hoc text lines. `icon` is an optional React node.
 */
const EmptyState = ({
  title = "Nothing here yet",
  body,
  ctaLabel,
  onCta,
  icon,
  style,
}) => (
  <div className="vv-empty" style={style}>
    {icon && <div className="vv-empty__icon">{icon}</div>}
    <div className="vv-empty__title">{title}</div>
    {body && <p className="vv-empty__body">{body}</p>}
    {ctaLabel && onCta && (
      <Button variant="secondary" size="sm" onClick={onCta}>
        {ctaLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
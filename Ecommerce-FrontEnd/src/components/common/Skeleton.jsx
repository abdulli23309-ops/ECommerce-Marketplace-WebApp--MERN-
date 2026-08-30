import React from "react";

/**
 * Skeleton primitives (UI-01). Only use where a loading indicator for shaped
 * content actually helps — never spam skeletons across the whole app.
 */
export const Skeleton = ({
  variant = "text",
  width,
  height,
  style,
  className = "",
}) => (
  <div
    className={`vv-skeleton vv-skeleton--${variant} ${className}`.trim()}
    style={{ ...(width ? { width } : {}), ...(height ? { height } : {}), ...style }}
    aria-hidden="true"
  />
);

/** Grid of product-card placeholders (Home, Listing, Store, related). */
export const GridSkeleton = ({ count = 8, ...rest }) => (
  <div className="vv-grid-skeleton" {...rest}>
    {Array.from({ length: count }).map((_, i) => (
      <div className="vv-grid-skeleton__item" key={i}>
        <Skeleton className="vv-grid-skeleton__image" variant="card" />
        <Skeleton variant="title" width="80%" />
        <Skeleton variant="text" width="50%" />
      </div>
    ))}
  </div>
);

/** Tabular/row skeleton (dashboard lists, tables). */
export const TableSkeleton = ({ rows = 5, header = true }) => (
  <div className="vv-table-skeleton" role="status" aria-label="Loading">
    {header && (
      <div className="vv-table-skeleton__header">
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="15%" />
      </div>
    )}
    <div className="vv-table-skeleton__body">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="row" />
      ))}
    </div>
  </div>
);

export default Skeleton;
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

/** Specialized Skeleton loaders for modern MERN frontend UI */

export const ProductCardSkeleton = () => (
  <div className="vv-grid-skeleton__item premium-card" style={{ padding: '1rem', border: '1px solid var(--border)' }}>
    <Skeleton variant="card" height="260px" style={{ borderRadius: '8px' }} />
    <Skeleton variant="title" width="80%" style={{ marginTop: '0.75rem' }} />
    <div style={{ display: 'flex', gap: '4px', margin: '0.5rem 0' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="text" width="16px" height="16px" style={{ borderRadius: '50%' }} />
      ))}
    </div>
    <Skeleton variant="text" width="40%" />
  </div>
);

export const DataTableSkeleton = ({ rows = 6, cols = 5 }) => (
  <div className="vv-table-skeleton" role="status" aria-label="Loading data">
    <div className="vv-table-skeleton__header" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="text" width="60%" />
      ))}
    </div>
    <div className="vv-table-skeleton__body" style={{ padding: '0.5rem 1rem' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem', padding: '0.85rem 0', borderBottom: r < rows - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <Skeleton key={c} variant="text" width={c === 0 ? "80%" : "50%"} />
          ))}
          <Skeleton variant="row" height="28px" style={{ borderRadius: '999px', width: '70px', justifySelf: 'center' }} />
        </div>
      ))}
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '110px' }}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Skeleton variant="text" width="50%" />
      <Skeleton variant="title" width="70%" height="2rem" />
      <Skeleton variant="text" width="30%" height="14px" />
    </div>
    <Skeleton variant="circle" width="48px" height="48px" style={{ borderRadius: '12px', width: '48px', height: '48px' }} />
  </div>
);

export const DetailHeroSkeleton = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', padding: '2rem 0' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Skeleton variant="card" height="400px" style={{ borderRadius: '12px' }} />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Skeleton variant="card" width="80px" height="80px" style={{ borderRadius: '8px' }} />
        <Skeleton variant="card" width="80px" height="80px" style={{ borderRadius: '8px' }} />
        <Skeleton variant="card" width="80px" height="80px" style={{ borderRadius: '8px' }} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Skeleton variant="title" width="80%" height="2.5rem" />
      <div style={{ display: 'flex', gap: '8px' }}>
        <Skeleton variant="text" width="100px" />
        <Skeleton variant="text" width="60px" />
      </div>
      <Skeleton variant="title" width="40%" height="2rem" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
      </div>
      <Skeleton variant="row" height="50px" style={{ borderRadius: '8px', marginTop: '1rem' }} />
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton variant="text" width="25%" height="16px" />
        <Skeleton variant="row" height="42px" style={{ borderRadius: '6px' }} />
      </div>
    ))}
    <Skeleton variant="row" height="46px" style={{ borderRadius: '6px', marginTop: '1rem' }} />
  </div>
);

export default Skeleton;
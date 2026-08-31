import React from "react";
import { DataTableSkeleton } from "./Skeleton";
import EmptyState from "./EmptyState";

const DataTable = ({
  headers = [],
  items = [],
  loading = false,
  renderRow,
  emptyTitle = "No data found",
  emptyBody = "There is nothing to display here at the moment.",
  emptyVariant = "default",
  onEmptyCta,
  emptyCtaLabel,
  className = "",
  style,
}) => {
  if (loading) {
    return <DataTableSkeleton rows={6} cols={headers.length || 5} />;
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        body={emptyBody}
        variant={emptyVariant}
        onCta={onEmptyCta}
        ctaLabel={emptyCtaLabel}
      />
    );
  }

  return (
    <div className={`table-responsive ${className}`} style={{ borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden", background: "var(--surface)", ...style }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)" }}>
            {headers.map((header, idx) => {
              const label = typeof header === "object" ? header.label : header;
              const cellStyle = typeof header === "object" ? header.style : {};
              return (
                <th
                  key={idx}
                  style={{
                    padding: "1rem 1.25rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    ...cellStyle,
                  }}
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getMyAppealById } from "../../services/adminService";
import { toastError } from "../../components/common/Toast";
import { Skeleton } from "../../components/common/Skeleton";

const SellerAppealDetailPage = () => {
  const { id } = useParams();
  const [appeal, setAppeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAppeal = async () => {
    try {
      const data = await getMyAppealById(id);
      setAppeal(data);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load appeal";
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppeal();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "2rem" }}>
        <Skeleton variant="text" width="30%" style={{ marginBottom: "1.5rem" }} />
        <Skeleton variant="title" width="60%" />
        <Skeleton variant="text" width="50%" style={{ marginTop: "0.5rem" }} />
        <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "1.5rem", marginTop: "1.5rem", border: "1px solid var(--border)" }}>
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="100%" style={{ marginTop: "0.75rem" }} />
          <Skeleton variant="text" width="90%" style={{ marginTop: "0.5rem" }} />
        </div>
        <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "1.5rem", marginTop: "1rem", border: "1px solid var(--border)" }}>
          <Skeleton variant="text" width="35%" />
          <Skeleton variant="text" width="100%" style={{ marginTop: "0.75rem" }} />
          <Skeleton variant="text" width="100%" style={{ marginTop: "0.5rem" }} />
        </div>
      </div>
    );
  }

  if (!appeal) {
    return (
      <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "2rem", textAlign: "center" }}>
        <h2>Appeal Not Found</h2>
        <p style={{ color: "var(--text-secondary)" }}>The requested appeal could not be found.</p>
        <Link to="/seller/appeals" style={{ marginTop: "1rem", display: "inline-block" }}>
          Back to Appeals
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <Link
          to="/seller/appeals"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Appeals
        </Link>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem" }}>
          Appeal Details
        </h1>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Appeal ID: <code style={{ fontSize: "0.8rem" }}>{appeal.id}</code>
        </div>
      </div>

      {/* Status Badge */}
      <div
        style={{
          display: "inline-block",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          fontSize: "0.8rem",
          fontWeight: 600,
          background:
            appeal.status === "Approved"
              ? "var(--success-bg)"
              : appeal.status === "Rejected"
              ? "var(--danger-bg)"
              : "var(--warning-bg)",
          color:
            appeal.status === "Approved"
              ? "var(--success)"
              : appeal.status === "Rejected"
              ? "var(--danger)"
              : "var(--warning)",
          marginBottom: "1.5rem",
        }}
      >
        {appeal.status}
      </div>

      {/* Appeal Text */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          border: "1px solid var(--border)",
        }}
      >
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Your Appeal Statement
        </h3>
        <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {appeal.appealText}
        </p>
        <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          Submitted: {formatDate(appeal.submittedAt)}
        </div>
      </div>

      {/* Decision (if decided) */}
      {(appeal.status === "Approved" || appeal.status === "Rejected") && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            border: "1px solid var(--border)",
          }}
        >
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Admin Decision
          </h3>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Decided On</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{formatDate(appeal.decidedAt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Decided By</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{appeal.decidedBy?.name || "Administrator"}</span>
            </div>
            {appeal.decisionReason && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>Decision Reason</span>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
                  {appeal.decisionReason}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {appeal.history && appeal.history.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "1.5rem",
            border: "1px solid var(--border)",
          }}
        >
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Full History
          </h3>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {appeal.history.map((h, idx) => (
              <div
                key={idx}
                style={{
                  padding: "1rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background:
                        h.event === "APPROVED"
                          ? "var(--success-bg)"
                          : h.event === "REJECTED"
                          ? "var(--danger-bg)"
                          : "var(--warning-bg)",
                      color:
                        h.event === "APPROVED"
                          ? "var(--success)"
                          : h.event === "REJECTED"
                          ? "var(--danger)"
                          : "var(--warning)",
                    }}
                  >
                    {h.event}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {formatDate(h.at)}
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  By: {h.by?.name || "System"}
                </div>
                {h.note && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    {h.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerAppealDetailPage;
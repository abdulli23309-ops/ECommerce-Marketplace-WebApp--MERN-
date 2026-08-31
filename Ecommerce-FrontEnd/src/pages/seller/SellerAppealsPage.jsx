import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyAppeals, getMySuspensionStatus } from "../../services/adminService";
import { formatDate } from "../../utils/dateHelper";
import { toastError } from "../../components/common/Toast";
import { Skeleton } from "../../components/common/Skeleton";

const SellerAppealsPage = () => {
  const [appeals, setAppeals] = useState([]);
  const [suspension, setSuspension] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasPendingAppeal, setHasPendingAppeal] = useState(false);
  const [cooldownDays, setCooldownDays] = useState(0);
  const [lastRejectedAt, setLastRejectedAt] = useState(null);

  const loadData = async () => {
    try {
      const [suspData, { items }] = await Promise.all([
        getMySuspensionStatus(),
        getMyAppeals(),
      ]);
      setSuspension(suspData);
      setAppeals(items);

      const pending = items.find((a) => a.status === "Pending");
      setHasPendingAppeal(!!pending);

      if (suspData.lastRejectedAt) {
        setLastRejectedAt(suspData.lastRejectedAt);
        const rejectedDate = new Date(suspData.lastRejectedAt);
        const now = new Date();
        const diffMs = rejectedDate.getTime() + 30 * 24 * 60 * 60 * 1000 - now.getTime();
        setCooldownDays(Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000))));
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load appeals";
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "2rem" }}>
        <Skeleton variant="title" width="50%" />
        <Skeleton variant="text" width="80%" style={{ marginTop: "0.5rem" }} />
        <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "1.5rem", marginTop: "1.5rem", border: "1px solid var(--border)" }}>
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="100%" style={{ marginTop: "0.75rem" }} />
        </div>
        <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "1.5rem", marginTop: "1rem", border: "1px solid var(--border)" }}>
          <Skeleton variant="text" width="100%" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1.5fr", gap: "1rem", marginTop: "1rem" }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="60%" />
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="100%" style={{ marginTop: "0.5rem" }} />
            <Skeleton variant="text" width="100%" style={{ marginTop: "0.5rem" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!suspension?.suspended) {
    return (
      <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "2rem", textAlign: "center" }}>
        <h2>Not Suspended</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Your account is not suspended. No appeals are needed.
        </p>
        <Link
          to="/seller/dashboard"
          style={{
            display: "inline-block",
            marginTop: "1rem",
            padding: "0.75rem 1.5rem",
            background: "var(--primary)",
            color: "var(--primary-contrast)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem" }}>
          Your Appeals
        </h1>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>
          View your appeal history and submit new appeals while suspended.
        </p>
      </div>

      {/* Status banner */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
              Suspension Status
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--danger)" }}>
              SUSPENDED
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Reason: {suspension.suspension?.reason || "No reason provided"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {!hasPendingAppeal && cooldownDays === 0 ? (
              <Link
                to="/seller/appeals/new"
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--primary)",
                  color: "var(--primary-contrast)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "opacity 0.2s",
                }}
              >
                Submit Appeal
              </Link>
            ) : hasPendingAppeal ? (
              <span
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  background: "rgba(234, 179, 8, 0.15)",
                  color: "var(--warning)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  display: "inline-block",
                }}
              >
                Appeal Pending Review
              </span>
            ) : (
              <span
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "var(--danger)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  display: "inline-block",
                }}
              >
                Cooldown: {cooldownDays} day(s) remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Appeals list */}
      <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
        {appeals.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            No appeals submitted yet.
            {!hasPendingAppeal && cooldownDays === 0 && (
              <Link
                to="/seller/appeals/new"
                style={{
                  display: "inline-block",
                  marginTop: "1rem",
                  padding: "0.75rem 1.5rem",
                  background: "var(--primary)",
                  color: "var(--primary-contrast)",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Submit Your First Appeal
              </Link>
            )}
          </div>
        ) : (
          <>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1.5fr", gap: "1rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <div>Appeal ID</div>
                <div>Submitted</div>
                <div>Status</div>
                <div>Decided</div>
                <div>Actions</div>
              </div>
            </div>
            <div style={{ padding: "0.5rem" }}>
              {appeals.map((appeal) => (
                <Link
                  key={appeal.id}
                  to={`/seller/appeals/${appeal.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 1.5fr",
                    gap: "1rem",
                    alignItems: "center",
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid var(--border)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {appeal.id.slice(-8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    {formatDate(appeal.submittedAt)}
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background:
                          appeal.status === "Approved"
                            ? "rgba(34, 197, 94, 0.15)"
                            : appeal.status === "Rejected"
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(234, 179, 8, 0.15)",
                        color:
                          appeal.status === "Approved"
                            ? "var(--success)"
                            : appeal.status === "Rejected"
                            ? "var(--danger)"
                            : "var(--warning)",
                      }}
                    >
                      {appeal.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {appeal.decidedAt ? formatDate(appeal.decidedAt) : "—"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    View Details
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "8px",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default SellerAppealsPage;
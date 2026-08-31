import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMySuspensionStatus, getMyAppeals, submitAppeal } from "../../services/adminService";
import { getImageUrl } from "../../utils/imageHelper";
import { toastSuccess, toastError } from "../../components/common/Toast";
import { Skeleton } from "../../components/common/Skeleton";

const SellerSuspendedPage = () => {
  const navigate = useNavigate();
  const [suspension, setSuspension] = useState(null);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealText, setAppealText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasPendingAppeal, setHasPendingAppeal] = useState(false);
  const [lastRejectedAt, setLastRejectedAt] = useState(null);
  const [cooldownDays, setCooldownDays] = useState(0);

  const loadSuspension = async () => {
    try {
      const data = await getMySuspensionStatus();
      setSuspension(data);
      if (data.suspension) {
        setLastRejectedAt(data.lastRejectedAt);
        if (data.lastRejectedAt) {
          const rejectedDate = new Date(data.lastRejectedAt);
          const now = new Date();
          const diffMs = rejectedDate.getTime() + 30 * 24 * 60 * 60 * 1000 - now.getTime();
          setCooldownDays(Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000))));
        }
      }
    } catch (err) {
      console.error("Failed to load suspension status", err);
    }
  };

  const loadAppeals = async () => {
    try {
      const { items } = await getMyAppeals();
      setAppeals(items);
      const pending = items.find((a) => a.status === "Pending");
      setHasPendingAppeal(!!pending);
    } catch (err) {
      console.error("Failed to load appeals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuspension();
    loadAppeals();
  }, []);

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    if (!appealText.trim()) {
      setError("Please enter your appeal statement.");
      return;
    }
    if (appealText.trim().length < 10) {
      setError("Appeal must be at least 10 characters.");
      return;
    }
    if (appealText.trim().length > 2000) {
      setError("Appeal must not exceed 2000 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitAppeal(appealText);
      toastSuccess("Appeal submitted successfully.");
      setAppealText("");
      setShowAppealForm(false);
      await loadAppeals();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit appeal. Please try again.";
      setError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

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

  useEffect(() => {
    if (!loading && suspension && !suspension.suspended) {
      navigate("/seller/dashboard");
    }
  }, [loading, suspension, navigate]);

  if (loading) {
    return (
      <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "2rem" }}>
        <Skeleton variant="title" width="60%" />
        <Skeleton variant="text" width="80%" style={{ marginTop: "1rem" }} />
        <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "1.5rem", marginTop: "1.5rem", border: "1px solid var(--border)" }}>
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="100%" style={{ marginTop: "0.75rem" }} />
          <Skeleton variant="text" width="90%" style={{ marginTop: "0.5rem" }} />
        </div>
        <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "1.5rem", marginTop: "1.5rem", border: "1px solid var(--border)" }}>
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="text" width="100%" style={{ marginTop: "1rem" }} />
          <Skeleton variant="text" width="90%" style={{ marginTop: "0.5rem" }} />
        </div>
      </div>
    );
  }

  if (!suspension?.suspended) {
    return null;
  }

  return (
    <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "2rem" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <svg
            width="28"
            height="28"
            fill="none"
            stroke="var(--danger)"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Account Suspended
        </h1>
        <p style={{ margin: 0, fontSize: "1rem", color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
          Your seller account has been suspended. You cannot create new marketplace activity,
          but you may still fulfil existing obligations (shipments, returns).
        </p>
      </div>

      {/* Suspension Details */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          border: "1px solid var(--border)",
        }}
      >
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Suspension Details
        </h2>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text-secondary)" }}>Reason</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{suspension.suspension?.reason || "No reason provided"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text-secondary)" }}>Suspended On</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{formatDate(suspension.suspension?.suspendedAt)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text-secondary)" }}>Suspended By</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{suspension.suspension?.suspendedBy?.name || "Administrator"}</span>
          </div>
        </div>
      </div>

      {/* Appeal Section */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          border: "1px solid var(--border)",
        }}
      >
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Appeal Your Suspension
        </h2>

        {hasPendingAppeal ? (
          <div style={{ color: "var(--warning)", fontSize: "0.9rem" }}>
            You already have a pending appeal. Please wait for the admin's decision.
          </div>
        ) : cooldownDays > 0 ? (
          <div style={{ color: "var(--danger)", fontSize: "0.9rem" }}>
            Your last appeal was rejected. You must wait <strong>{cooldownDays} day(s)</strong> before submitting a new appeal (30-day cooldown).
          </div>
        ) : (
          <>
            <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              You may submit an appeal to request reinstatement. Be clear and concise — explain why the suspension
              should be lifted or provide context about the situation. Appeals are text-only in this version.
            </p>
            {!showAppealForm ? (
              <button
                onClick={() => setShowAppealForm(true)}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--primary)",
                  color: "var(--primary-contrast)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Submit Appeal
              </button>
            ) : (
              <form onSubmit={handleSubmitAppeal}>
                <textarea
                  value={appealText}
                  onChange={(e) => setAppealText(e.target.value)}
                  placeholder="Explain why your suspension should be lifted... (10-2000 characters)"
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    resize: "vertical",
                    fontFamily: "inherit",
                    marginBottom: "1rem",
                    boxSizing: "border-box",
                  }}
                />
                {error && (
                  <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                    {error}
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAppealForm(false);
                      setAppealText("");
                      setError("");
                    }}
                    style={{
                      padding: "0.65rem 1.25rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "0.65rem 1.25rem",
                      borderRadius: "8px",
                      border: "none",
                      background: "var(--success)",
                      color: "#fff",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "Submitting..." : "Submit Appeal"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Appeal History */}
      {appeals.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "1.5rem",
            border: "1px solid var(--border)",
          }}
        >
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Appeal History
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            {appeals.map((appeal) => (
              <div
                key={appeal.id}
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
                      fontSize: "0.75rem",
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
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Submitted: {formatDate(appeal.submittedAt)}
                  </span>
                </div>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
                  {appeal.appealText}
                </p>
                {appeal.decidedAt && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Decided: {formatDate(appeal.decidedAt)}
                    {appeal.decisionReason && (
                      <span style={{ marginLeft: "1rem" }}>Reason: {appeal.decisionReason}</span>
                    )}
                  </div>
                )}
                {appeal.history && appeal.history.length > 1 && (
                  <details style={{ marginTop: "0.75rem" }}>
                    <summary style={{ fontSize: "0.8rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                      View full history
                    </summary>
                    <div style={{ marginTop: "0.5rem", display: "grid", gap: "0.5rem", fontSize: "0.8rem" }}>
                      {appeal.history.map((h, idx) => (
                        <div key={idx} style={{ color: "var(--text-secondary)", display: "flex", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {h.event}:
                          </span>
                          <span>{formatDate(h.at)} by {h.by?.name || "System"}</span>
                          {h.note && <span style={{ marginLeft: "0.5rem" }}>{h.note}</span>}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing obligations note */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          background: "rgba(34, 197, 94, 0.1)",
          border: "1px solid rgba(34, 197, 94, 0.2)",
          borderRadius: "8px",
          color: "var(--success)",
          fontSize: "0.85rem",
        }}
      >
        <strong>Note:</strong> While suspended, you can still fulfil existing obligations such as
        processing shipments and handling returns for orders already placed. These functions remain
        accessible from your dashboard.
      </div>
    </div>
  );
};

export default SellerSuspendedPage;
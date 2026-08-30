import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMySuspensionStatus, submitAppeal, getMyAppeals } from "../../services/adminService";
import { toastSuccess, toastError } from "../../components/common/Toast";
import { Skeleton } from "../../components/common/Skeleton";

const SellerAppealNewPage = () => {
  const navigate = useNavigate();
  const [suspension, setSuspension] = useState(null);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appealText, setAppealText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasPendingAppeal, setHasPendingAppeal] = useState(false);
  const [lastRejectedAt, setLastRejectedAt] = useState(null);
  const [cooldownDays, setCooldownDays] = useState(0);
  const [charCount, setCharCount] = useState(0);

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
      setError(err.response?.data?.message || "Failed to load suspension status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
    try {
      await submitAppeal(appealText);
      toastSuccess("Appeal submitted successfully.");
      navigate("/seller/appeals");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to submit appeal. Please try again.";
      setError(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setAppealText(text);
    setCharCount(text.length);
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
          <Skeleton variant="rect" height="200px" style={{ marginTop: "1rem" }} />
        </div>
      </div>
    );
  }

  // Check if user is suspended
  if (!suspension?.suspended) {
    return (
      <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "2rem", textAlign: "center" }}>
        <h2>Not Suspended</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>
          Your account is not suspended. You don't need to submit an appeal.
        </p>
        <Link
          to="/seller/dashboard"
          style={{
            display: "inline-block",
            marginTop: "1.5rem",
            padding: "0.75rem 1.5rem",
            background: "var(--primary)",
            color: "#fff",
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

  // Check for pending appeal or cooldown
  if (hasPendingAppeal) {
    return (
      <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
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
        </div>

        <div
          style={{
            background: "rgba(234, 179, 8, 0.1)",
            border: "1px solid rgba(234, 179, 8, 0.3)",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(234, 179, 8, 0.2)",
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
              stroke="var(--warning)"
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
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Appeal Already Pending
          </h2>
          <p style={{ margin: "0 0 1.5rem", color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto 1.5rem" }}>
            You already have an appeal under review. Please wait for the admin's decision before submitting another.
          </p>
          <Link
            to="/seller/appeals"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "var(--primary)",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            View My Appeals
          </Link>
        </div>
      </div>
    );
  }

  if (cooldownDays > 0) {
    return (
      <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
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
        </div>

        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            padding: "2rem",
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
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Appeal Cooldown Active
          </h2>
          <p style={{ margin: "0 0 1.5rem", color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto 1.5rem" }}>
            Your last appeal was rejected. You must wait <strong>{cooldownDays} day(s)</strong> before submitting a new appeal
            (30-day cooldown from rejection).
          </p>
          <Link
            to="/seller/appeals"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "var(--primary)",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            View My Appeals
          </Link>
        </div>
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
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem" }}>
          Submit New Appeal
        </h1>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>
          Explain why your suspension should be lifted. Be clear and concise.
        </p>
      </div>

      {/* Suspension Context */}
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
          Current Suspension
        </h3>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Reason</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{suspension.reason || "No reason provided"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Suspended On</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{formatDate(suspension.suspendedAt)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Suspended By</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{suspension.suspendedBy?.name || "Administrator"}</span>
          </div>
        </div>
      </div>

      {/* Appeal Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Your Appeal Statement
            </h3>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: charCount > 1800 ? "var(--danger)" : charCount > 1500 ? "var(--warning)" : "var(--text-secondary)",
              }}
            >
              {charCount}/2000 characters
            </span>
          </div>

          <textarea
            value={appealText}
            onChange={handleTextChange}
            placeholder="Explain why your suspension should be lifted... (10-2000 characters)"
            rows={10}
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
            maxLength={2000}
          />

          <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Tips for a successful appeal: Acknowledge the issue, explain what happened, describe what you've done to fix it,
            and outline steps to prevent recurrence. Be honest and professional.
          </p>

          {error && (
            <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <Link
              to="/seller/appeals"
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--primary)",
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
        </div>
      </form>

      {/* Previous Appeals (if any) */}
      {appeals.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "1.5rem",
            border: "1px solid var(--border)",
          }}
        >
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Your Previous Appeals
          </h3>
          <div style={{ display: "grid", gap: "0.75rem" }}>
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

export default SellerAppealNewPage;
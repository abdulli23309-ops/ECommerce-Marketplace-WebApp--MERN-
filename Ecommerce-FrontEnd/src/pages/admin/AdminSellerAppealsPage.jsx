import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getSellerAppeals,
  decideSellerAppeal,
} from "../../services/adminService";
import { formatDate } from "../../utils/dateHelper";
import { getStatusBadgeStyle } from "../../utils/statusBadge";
import { toastError } from "../../components/common/Toast";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const getCooldownInfo = (appeal) => {
  if (appeal.status !== "Rejected" || !appeal.decidedAt) return null;
  const decidedAt = new Date(appeal.decidedAt).getTime();
  const cooldownEnd = decidedAt + 30 * 24 * 60 * 60 * 1000; // 30 days
  const now = Date.now();
  if (now >= cooldownEnd) return null;
  const remainingMs = cooldownEnd - now;
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return { remainingDays, cooldownEnd: new Date(cooldownEnd) };
};

const ReviewIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ApproveIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RejectIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AdminSellerAppealsPage = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [pendingDecision, setPendingDecision] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  const showMessage = (message) => {
    setActionMessage(message);
    setActionError("");
  };

  const showError = (message) => {
    setActionError(message);
    setActionMessage("");
  };

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, pageSize };
      if (statusFilter) params.status = statusFilter;
      const { items, total, totalPages: pages } = await getSellerAppeals(params);
      setAppeals(items || []);
      setTotalItems(total || 0);
      setTotalPages(pages || 1);
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Failed to load appeals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppeals();
  }, [currentPage, statusFilter]);

  const handleDecision = async (decision) => {
    if (!selectedAppeal) return;
    if (decision === "Rejected" && !decisionReason.trim()) {
      toastError("Please provide a rejection reason.");
      return;
    }

    setActionLoading(true);
    try {
      await decideSellerAppeal(selectedAppeal.id, decision, decisionReason.trim());
      setDecisionModalOpen(false);
      setSelectedAppeal(null);
      setDecisionReason("");
      setPendingDecision("");
      await loadAppeals();
      showMessage(`Appeal ${decision.toLowerCase()} successfully.`);
    } catch (err) {
      console.error("Failed to decide appeal", err);
      showError(err.response?.data?.message || `Could not ${decision.toLowerCase()} appeal.`);
    } finally {
      setActionLoading(false);
    }
  };

  const openDecisionModal = (appeal, decision) => {
    setSelectedAppeal(appeal);
    setPendingDecision(decision);
    setDecisionReason("");
    setDecisionModalOpen(true);
  };

  // Escape-to-close + body scroll lock for Decision modal
  useEffect(() => {
    if (!decisionModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setDecisionModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [decisionModalOpen]);

  const handleFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  return (
    <div style={{ backgroundColor: "var(--bg-secondary)", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Seller Appeals Dashboard
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Review and decide on seller suspension appeals.
            </p>
          </div>
          <Link
            to="/admin/sellers"
            style={{
              padding: "0.65rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Seller Approvals
          </Link>
        </div>

        {actionMessage && (
          <div style={{ ...feedbackStyle, background: "var(--success-bg)", color: "var(--success-text)" }}>
            {actionMessage}
          </div>
        )}

        {actionError && (
          <div style={{ ...feedbackStyle, background: "var(--danger-bg)", color: "var(--danger-text)" }}>
            {actionError}
          </div>
        )}

        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            boxShadow: "0 1px 3px var(--shadow)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              Loading appeals...
            </div>
          ) : appeals.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              No appeals found.
            </div>
          ) : (
            <>
              <div style={filterBarStyle}>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Filter by status:
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    style={filterSelectStyle}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {totalItems} appeal{totalItems !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="table-responsive">
              <table className="appeals-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                    <th style={appealThStyle}>Seller / Store</th>
                    <th style={appealThStyle}>Suspension</th>
                    <th style={appealThStyle}>Appeal</th>
                    <th style={appealThStyle}>Warning Count</th>
                    <th style={appealThStyle}>Status</th>
                    <th style={{ ...appealThStyle, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appeals.map((appeal) => {
                    const cooldown = getCooldownInfo(appeal);
                    const isPending = appeal.status === "Pending";
                    const canDecide = isPending;

                    return (
                      <tr
                        key={appeal.id || appeal._id}
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td style={appealTdStyle}>
                          <div>
                            <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>
                              {appeal.sellerName}
                            </strong>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                              {appeal.sellerEmail}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                              Store: {appeal.storeName}
                            </div>
                          </div>
                        </td>
                        <td style={appealTdStyle}>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                            <strong>Reason:</strong> {appeal.suspensionReason || "—"}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                            Suspended: {formatDateTime(appeal.suspendedAt)}
                          </div>
                        </td>
                        <td style={appealTdStyle}>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                            <strong>Submitted:</strong> {formatDateTime(appeal.submittedAt)}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                            {appeal.appealText && (
                              <span style={{ maxWidth: "300px", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {appeal.appealText}
                              </span>
                            )}
                          </div>
                          {appeal.decidedAt && (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                              Decided: {formatDateTime(appeal.decidedAt)}
                              {appeal.decidedBy && <span> by {appeal.decidedBy.name || "Admin"}</span>}
                            </div>
                          )}
                          {appeal.decisionReason && (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem", fontStyle: "italic" }}>
                              Reason: {appeal.decisionReason}
                            </div>
                          )}
                        </td>
                        <td style={appealTdStyle}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                            {appeal.warningCount || 0}
                          </span>
                        </td>
                        <td style={appealTdStyle}>
                          <span style={getStatusBadgeStyle(appeal.status)}>{appeal.status}</span>
                          {cooldown && (
                            <div style={cooldownBadgeStyle}>
                              Cooldown: {cooldown.remainingDays} day{cooldown.remainingDays !== 1 ? "s" : ""} remaining
                            </div>
                          )}
                        </td>
                        <td style={{ ...appealTdStyle, textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                              onClick={() => openDecisionModal(appeal, "Approved")}
                              style={{ ...iconBtnStyle, color: "var(--success)" }}
                              title="Approve appeal"
                              disabled={actionLoading || !canDecide}
                            >
                              <ApproveIcon />
                            </button>
                            <button
                              onClick={() => openDecisionModal(appeal, "Rejected")}
                              style={{ ...iconBtnStyle, color: "var(--danger)" }}
                              title="Reject appeal"
                              disabled={actionLoading || !canDecide}
                            >
                              <RejectIcon />
                            </button>
                            <Link
                              to={`/admin/sellers?appeal=${appeal.id}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ ...iconBtnStyle, color: "var(--info-text)", display: "inline-flex" }}
                              title="View seller details"
                            >
                              <ReviewIcon />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

              {totalPages > 1 && (
                <div style={paginationStyle}>
                  <button
                    className="page-btn"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                  <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="page-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {decisionModalOpen && selectedAppeal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="decision-modal-title"
            style={modalOverlayStyle}
            onClick={() => setDecisionModalOpen(false)}
          >
            <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
              <h3 id="decision-modal-title" style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {pendingDecision === "Approved" ? "Approve" : "Reject"} Appeal
              </h3>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Seller: <strong>{selectedAppeal.sellerName}</strong> ({selectedAppeal.sellerEmail})
              </p>

              <div style={{ marginBottom: "1rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  <strong>Suspension Reason:</strong> {selectedAppeal.suspensionReason || "—"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  <strong>Suspended:</strong> {formatDateTime(selectedAppeal.suspendedAt)}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <strong>Appeal Submitted:</strong> {formatDateTime(selectedAppeal.submittedAt)}
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={fieldLabelStyle}>Appeal Text</label>
                <textarea
                  value={selectedAppeal.appealText || ""}
                  readOnly
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", background: "var(--bg-secondary)" }}
                />
              </div>

              {pendingDecision === "Rejected" && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={fieldLabelStyle}>Rejection Reason</label>
                  <textarea
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Enter reason for rejection (required)..."
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                    disabled={actionLoading}
                  />
                </div>
              )}

              <div style={modalActionRowStyle}>
                <button style={secondaryButtonStyle} onClick={() => setDecisionModalOpen(false)} disabled={actionLoading}>
                  Cancel
                </button>
                <button
                  style={{ ...dangerButtonStyle, background: pendingDecision === "Approved" ? "var(--success)" : "var(--danger)" }}
                  onClick={() => handleDecision(pendingDecision)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : `Confirm ${pendingDecision}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const appealThStyle = {
  padding: "0.75rem 1.25rem",
  textAlign: "left",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const appealTdStyle = {
  padding: "0.75rem 1.25rem",
  fontSize: "0.9rem",
  color: "var(--text-primary)",
  verticalAlign: "top",
};

const iconBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "4px",
  color: "var(--text-secondary)",
  transition: "background 0.15s, color 0.15s",
};

const filterBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1rem 1.5rem",
  borderBottom: "1px solid var(--border)",
  background: "var(--bg-secondary)",
};

const filterSelectStyle = {
  padding: "0.4rem 0.75rem",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-primary)",
  fontSize: "0.85rem",
  minWidth: "160px",
};

const cooldownBadgeStyle = {
  marginTop: "0.35rem",
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "var(--warning-text)",
  background: "var(--warning-bg)",
  padding: "2px 8px",
  borderRadius: "4px",
  display: "inline-block",
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  backdropFilter: "blur(4px)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
};

const modalCardStyle = {
  background: "var(--surface)",
  color: "var(--text-primary)",
  borderRadius: "16px",
  padding: "2rem",
  maxWidth: "600px",
  width: "90%",
  border: "1px solid var(--border)",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
};

const fieldLabelStyle = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "0.5rem",
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  fontSize: "0.9rem",
};

const modalActionRowStyle = {
  display: "flex",
  gap: "0.75rem",
  justifyContent: "flex-end",
  marginTop: "1.5rem",
};

const secondaryButtonStyle = {
  padding: "0.65rem 1.25rem",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-secondary)",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
};

const dangerButtonStyle = {
  padding: "0.65rem 1.25rem",
  borderRadius: "8px",
  border: "none",
  background: "var(--danger)",
  color: "#fff",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
};

const feedbackStyle = {
  borderRadius: "8px",
  padding: "0.85rem 1rem",
  marginBottom: "1rem",
  fontSize: "0.9rem",
  fontWeight: 600,
};

const paginationStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "1rem",
  padding: "1.5rem",
  borderTop: "1px solid var(--border)",
};

export default AdminSellerAppealsPage;
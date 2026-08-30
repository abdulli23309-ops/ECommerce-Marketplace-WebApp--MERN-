import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getSellers,
  approveSeller,
  rejectSeller,
  warnSeller,
  suspendSeller,
  reinstateSeller,
  getSellerTimeline,
} from "../../services/adminService";
import { getImageUrl } from "../../utils/imageHelper";
import { getStatusBadgeStyle } from "../../utils/statusBadge";
import {
  SELLER_LOW_RATING_THRESHOLD,
  MAX_WARNINGS,
} from "../../utils/warningThresholds";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toastError, toastWarning } from "../../components/common/Toast";

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

const SuspendIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const ReinstateIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ReviewIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const getSellerModerationStatus = (seller) => {
  if (seller.moderationStatus) return seller.moderationStatus;

  const rating = Number(seller.averageRating ?? seller.avgRating ?? 0);
  const lowRating =
    seller.lowRatingStatus === true ||
    (rating > 0 && rating < SELLER_LOW_RATING_THRESHOLD);
  const warningCount = seller.warningCount || 0;

  if (seller.status === "Suspended") {
    if (seller.pendingAppeal) return "Appeal Pending";
    if (seller.lastRejectedAppeal) return "Appeal Rejected";
    return "Suspended";
  }

  if (seller.status === "Approved") {
    return lowRating || warningCount > 0 ? "At Risk" : "Active";
  }

  return seller.status || "—";
};

const getAppealReviewPath = (appeal) =>
  appeal?._id || appeal?.id
    ? `/admin/seller-appeals?appeal=${appeal._id || appeal.id}`
    : "/admin/seller-appeals";

// Modern Warning Modal Component
const AdminWarningModal = ({ seller, onConfirm, onCancel }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const predefinedReasons = [
    "Policy Violation: Counterfeit/Fake Items",
    "Consistent Delayed Shipments",
    "Poor Customer Rating / Quality Issues",
    "Other",
  ];

  const handleConfirm = () => {
    const finalReason = selectedReason === "Other" ? customReason : selectedReason;
    if (!finalReason.trim()) {
      toastWarning("Please select or enter a warning reason.");
      return;
    }
    onConfirm(finalReason);
  };

  return (
    <div style={modalOverlayStyle} onClick={onCancel}>
      <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Issue Warning
        </h3>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Seller: <strong>{seller?.businessName}</strong>
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <label style={fieldLabelStyle}>Warning Reason</label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select a reason...</option>
            {predefinedReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        {selectedReason === "Other" && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={fieldLabelStyle}>Custom Reason</label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter your custom warning reason..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
        )}

        <div style={modalActionRowStyle}>
          <button onClick={onCancel} style={secondaryButtonStyle}>
            Cancel
          </button>
          <button onClick={handleConfirm} style={dangerButtonStyle}>
            Issue Warning
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminSuspendModal = ({ seller, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      toastError("Please provide a suspension reason.");
      return;
    }
    if (confirmation.trim().toUpperCase() !== "SUSPEND") {
      toastWarning('Type "SUSPEND" to confirm this action.');
      return;
    }
    onConfirm(reason.trim(), internalNote.trim());
  };

  return (
    <div style={modalOverlayStyle} onClick={loading ? undefined : onCancel}>
      <div style={{ ...modalCardStyle, maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--danger-text)" }}>
          Suspend Seller
        </h3>
        <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          This restricts marketplace selling for <strong>{seller?.businessName}</strong> while preserving their customer account access.
        </p>
        <div
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger-text)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            padding: "0.75rem",
            fontSize: "0.85rem",
            marginBottom: "1rem",
          }}
        >
          Seller products will not be auto-republished after reinstatement. Backend restrictions remain the security boundary.
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={fieldLabelStyle}>Suspension Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain the policy, rating, or operational reason for suspension..."
            rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={fieldLabelStyle}>Internal Note</label>
          <textarea
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="Optional admin-only note for moderation context..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={fieldLabelStyle}>Explicit Confirmation</label>
          <input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder='Type "SUSPEND" to confirm'
            style={inputStyle}
            disabled={loading}
          />
        </div>

        <div style={modalActionRowStyle}>
          <button onClick={onCancel} style={secondaryButtonStyle} disabled={loading}>
            Cancel
          </button>
          <button onClick={handleConfirm} style={dangerButtonStyle} disabled={loading}>
            {loading ? "Suspending..." : "Confirm Suspension"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Seller Details Drawer Component
const SellerDetailsDrawer = ({
  seller,
  onClose,
  onApprove,
  onReject,
  onSuspend,
  onReinstate,
  timeline,
  timelineLoading,
}) => {
  if (!seller) return null;

  const rating = Number(seller.averageRating ?? seller.avgRating ?? 0);
  const lowRating =
    seller.lowRatingStatus === true ||
    (rating > 0 && rating < SELLER_LOW_RATING_THRESHOLD);
  const warningCount = seller.warningCount || 0;
  const moderationStatus = getSellerModerationStatus(seller);

  const drawerBackground = lowRating
    ? "linear-gradient(rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.15)), var(--surface)"
    : "var(--surface)";

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(3px)",
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          height: "100vh",
          width: "850px",
          maxWidth: "100vw",
          background: drawerBackground,
          boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.3)",
          zIndex: 1000,
          overflowY: "auto",
          animation: "slideInRight 0.3s ease-out",
        }}
      >
        <style>
          {`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}
        </style>

        <div
          style={{
            position: "sticky",
            top: 0,
            background: drawerBackground,
            padding: "1.5rem 2rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Seller Details
            </h2>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Review seller information and moderation history
            </p>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: "2rem" }}>
          <section style={sectionCardStyle}>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
              {seller.storeLogoUrl ? (
                <img
                  src={getImageUrl(seller.storeLogoUrl)}
                  alt="Store Logo"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "12px",
                    objectFit: "cover",
                    border: "2px solid var(--border)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "12px",
                    background: "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    border: "2px dashed var(--border)",
                  }}
                >
                  No Logo
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {seller.businessName}
                </h3>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  {seller.storeName || "Store not yet created"}
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={getStatusBadgeStyle(seller.status)}>{seller.status}</span>
                  <span style={getStatusBadgeStyle(moderationStatus)}>{moderationStatus}</span>
                </div>
              </div>
            </div>
          </section>

          {lowRating && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "12px",
                padding: "1rem 1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <svg width="20" height="20" fill="var(--danger)" viewBox="0 0 24 24">
                  <path d="M12 2L2 22h20L12 2zm0 3.5L19.5 20h-15L12 5.5zM11 10v4h2v-4h-2zm0 5v2h2v-2h-2z" />
                </svg>
                <div>
                  <strong style={{ color: "var(--danger-text)", fontSize: "0.9rem" }}>Low Rating Alert</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Rating: {rating.toFixed(1)} • Warnings: {warningCount}/{MAX_WARNINGS}
                  </p>
                </div>
              </div>
            </div>
          )}

          <section style={sectionCardStyle}>
            <SectionTitle>Contact Information</SectionTitle>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <InfoRow label="Full Name" value={seller.fullName || seller.user?.name || "—"} />
              <InfoRow label="Email" value={seller.email || seller.user?.email || "—"} />
              <InfoRow label="Phone" value={seller.phone || "—"} />
              <InfoRow label="City" value={seller.city || "—"} />
            </div>
          </section>

          <section style={sectionCardStyle}>
            <SectionTitle>Business Information</SectionTitle>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <InfoRow label="Business Address" value={seller.address || "—"} />
              <InfoRow label="Tax ID" value={seller.taxId || "—"} />
              {seller.storeDescription && (
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                    Store Description
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.6 }}>
                    {seller.storeDescription}
                  </p>
                </div>
              )}
            </div>
          </section>

          {(seller.activeSuspension || seller.pendingAppeal || seller.lastRejectedAppeal) && (
            <section style={sectionCardStyle}>
              <SectionTitle>Suspension & Appeal State</SectionTitle>
              {seller.activeSuspension && (
                <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
                  <InfoRow label="Suspension Status" value={seller.activeSuspension.status || "Active"} />
                  <InfoRow label="Suspended At" value={formatDate(seller.activeSuspension.suspendedAt)} />
                  <InfoRow label="Reason" value={seller.activeSuspension.reason || "—"} />
                  <InfoRow label="Internal Note" value={seller.activeSuspension.internalNote || "—"} />
                </div>
              )}

              {seller.pendingAppeal && (
                <div style={appealNoticeStyle("info")}>
                  <strong>Pending Appeal</strong>
                  <p style={noticeTextStyle}>
                    Submitted {formatDate(seller.pendingAppeal.submittedAt)}. Review this appeal before taking a final reinstatement decision.
                  </p>
                  <Link
                    to={getAppealReviewPath(seller.pendingAppeal)}
                    onClick={(e) => e.stopPropagation()}
                    style={inlineLinkButtonStyle}
                  >
                    Review Appeal
                  </Link>
                </div>
              )}

              {seller.lastRejectedAppeal && !seller.pendingAppeal && (
                <div style={appealNoticeStyle("danger")}>
                  <strong>Most Recent Appeal Rejected</strong>
                  <p style={noticeTextStyle}>
                    Decided {formatDate(seller.lastRejectedAppeal.decidedAt)}. The seller may submit another appeal after the 30-day cooldown.
                  </p>
                  {seller.lastRejectedAppeal.decisionReason && (
                    <p style={{ ...noticeTextStyle, marginTop: "0.5rem" }}>
                      Reason: {seller.lastRejectedAppeal.decisionReason}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {seller.warningHistory && seller.warningHistory.length > 0 && (
            <section style={sectionCardStyle}>
              <SectionTitle>Warning History</SectionTitle>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {seller.warningHistory.map((warning, idx) => (
                  <div key={idx} style={timelineCardStyle}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                      <strong>Warning {idx + 1}:</strong> {warning.reason || "No reason provided"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {formatDate(warning.warnedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section style={sectionCardStyle}>
            <SectionTitle>Moderation Timeline</SectionTitle>
            {timelineLoading ? (
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Loading moderation timeline...
              </p>
            ) : timeline?.length > 0 ? (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {timeline.map((entry, idx) => (
                  <div key={`${entry.kind}-${entry.at}-${idx}`} style={timelineCardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.35rem" }}>
                      <strong style={{ color: "var(--text-primary)", fontSize: "0.85rem", textTransform: "capitalize" }}>
                        {entry.kind}{entry.event ? ` • ${entry.event}` : ""}
                      </strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                        {formatDate(entry.at)}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      {entry.note || "No note provided"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                No moderation timeline entries yet.
              </p>
            )}
          </section>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--border)",
              flexWrap: "wrap",
            }}
          >
            {seller.status === "Pending" && (
              <>
                <button onClick={() => onApprove(seller.id || seller._id)} style={{ ...actionButtonStyle, background: "var(--success)" }}>
                  Approve Seller
                </button>
                <button onClick={() => onReject(seller)} style={{ ...actionButtonStyle, background: "var(--danger)" }}>
                  Reject Seller
                </button>
              </>
            )}

            {seller.status === "Approved" && (
              <button onClick={() => onSuspend(seller)} style={{ ...actionButtonStyle, background: "var(--danger)" }}>
                Suspend Seller
              </button>
            )}

            {seller.status === "Suspended" && (
              <button onClick={() => onReinstate(seller)} style={{ ...actionButtonStyle, background: "var(--success)" }}>
                Reinstate Seller
              </button>
            )}

            {seller.pendingAppeal && (
              <Link to={getAppealReviewPath(seller.pendingAppeal)} style={{ ...actionButtonStyle, background: "var(--info)", textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
                Review Appeal
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const SectionTitle = ({ children }) => (
  <h4
    style={{
      margin: "0 0 1rem",
      fontSize: "1rem",
      fontWeight: 700,
      color: "var(--text-primary)",
      paddingBottom: "0.75rem",
      borderBottom: "2px solid var(--border)",
    }}
  >
    {children}
  </h4>
);

// Info Row Component
const InfoRow = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: "1rem",
      padding: "0.5rem 0",
      borderBottom: "1px dashed var(--border)",
    }}
  >
    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>{label}</span>
    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)", textAlign: "right" }}>{value}</span>
  </div>
);

const SellerApprovalPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [sellerToWarn, setSellerToWarn] = useState(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [sellerToSuspend, setSellerToSuspend] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [reinstateTarget, setReinstateTarget] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(sellers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSellers = sellers.slice(startIndex, startIndex + itemsPerPage);

  const showMessage = (message) => {
    setActionMessage(message);
    setActionError("");
  };

  const showError = (message) => {
    setActionError(message);
    setActionMessage("");
  };

  const loadSellers = async () => {
    setLoading(true);
    try {
      const { items } = await getSellers();
      setSellers(items || []);
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Failed to load sellers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [sellers.length, currentPage, totalPages]);

  const refreshAfterAction = async (message) => {
    await loadSellers();
    showMessage(message);
    setDrawerOpen(false);
    setSelectedSeller(null);
  };

  const handleApprove = async (sellerId) => {
    setActionLoading(true);
    try {
      await approveSeller(sellerId);
      await refreshAfterAction("Seller approved successfully.");
    } catch (err) {
      console.error("Failed to approve seller", err);
      showError(err.response?.data?.message || "Could not approve seller.");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (seller) => {
    setSelectedSeller(seller);
    setRejectReason("");
    setRejectModalOpen(true);
    setDrawerOpen(false);
  };

  const handleRejectSubmit = async () => {
    if (!selectedSeller) return;
    setActionLoading(true);
    try {
      await rejectSeller(selectedSeller.id, rejectReason);
      setRejectModalOpen(false);
      await refreshAfterAction("Seller rejected successfully.");
    } catch (err) {
      console.error("Failed to reject seller", err);
      showError(err.response?.data?.message || "Could not reject seller.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailDrawer = async (seller) => {
    setSelectedSeller(seller);
    setDrawerOpen(true);
    setTimeline([]);
    setTimelineLoading(true);
    try {
      const data = await getSellerTimeline(seller.id || seller._id);
      setTimeline(data.timeline || []);
    } catch (err) {
      console.error("Failed to load seller timeline", err);
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const openWarningModal = (seller) => {
    setSellerToWarn(seller);
    setWarningModalOpen(true);
  };

  const handleWarnSellerConfirm = async (reason) => {
    if (!sellerToWarn) return;

    setActionLoading(true);
    try {
      await warnSeller(sellerToWarn.id, reason);
      setWarningModalOpen(false);
      setSellerToWarn(null);
      await loadSellers();
      showMessage("Seller warning issued successfully.");
    } catch (err) {
      console.error("Failed to warn seller", err);
      showError(err.response?.data?.message || "Could not issue warning.");
    } finally {
      setActionLoading(false);
    }
  };

  const openSuspendModal = (seller) => {
    setSellerToSuspend(seller);
    setSuspendModalOpen(true);
    setDrawerOpen(false);
  };

  const handleSuspendConfirm = async (reason, internalNote) => {
    if (!sellerToSuspend) return;

    setActionLoading(true);
    try {
      await suspendSeller(sellerToSuspend.id, reason, internalNote);
      setSuspendModalOpen(false);
      setSellerToSuspend(null);
      await refreshAfterAction("Seller suspended successfully.");
    } catch (err) {
      console.error("Failed to suspend seller", err);
      showError(err.response?.data?.message || "Could not suspend seller.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReinstateClick = (seller) => {
    setReinstateTarget(seller);
  };

  const handleReinstateConfirm = async () => {
    const seller = reinstateTarget;
    setReinstateTarget(null);
    if (!seller) return;

    setActionLoading(true);
    try {
      await reinstateSeller(seller.id || seller._id);
      await refreshAfterAction("Seller reinstated successfully.");
    } catch (err) {
      console.error("Failed to reinstate seller", err);
      showError(err.response?.data?.message || "Could not reinstate seller.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg-secondary)", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Seller Approval & Moderation
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Review seller applications, manage warnings, suspensions, reinstatements, and appeals.
            </p>
          </div>
          <Link
            to="/admin/seller-appeals"
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
            Appeals Dashboard
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
              Loading sellers...
            </div>
          ) : sellers.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              No sellers to review.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <th style={sellerThStyle}>Business Name</th>
                  <th style={sellerThStyle}>Owner</th>
                  <th style={sellerThStyle}>Email</th>
                  <th style={sellerThStyle}>Rating / Warnings</th>
                  <th style={sellerThStyle}>Application</th>
                  <th style={sellerThStyle}>Moderation</th>
                  <th style={{ ...sellerThStyle, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSellers.map((seller) => {
                  const rating = Number(seller.averageRating ?? seller.avgRating ?? 0);
                  const lowRating =
                    seller.lowRatingStatus === true ||
                    (rating > 0 && rating < SELLER_LOW_RATING_THRESHOLD);
                  const warningCount = seller.warningCount || 0;
                  const moderationStatus = getSellerModerationStatus(seller);
                  const canWarn =
                    seller.status === "Approved" &&
                    lowRating &&
                    warningCount < MAX_WARNINGS;

                  return (
                    <tr
                      key={seller.id || seller._id}
                      className={lowRating ? "warning-flag-red" : ""}
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s", cursor: "pointer" }}
                      onClick={() => openDetailDrawer(seller)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                    >
                      <td style={sellerTdStyle}>{seller.businessName}</td>
                      <td style={sellerTdStyle}>{seller.fullName || seller.user?.name || "—"}</td>
                      <td style={sellerTdStyle}>{seller.email || seller.user?.email || "—"}</td>
                      <td style={sellerTdStyle}>
                        {lowRating ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={lowRatingBadgeStyle}>Low Rating {rating.toFixed(1)}</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                              {warningCount}/{MAX_WARNINGS} warnings
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                            {rating > 0 ? `${rating.toFixed(1)} ★` : "No rating"}
                          </span>
                        )}
                      </td>
                      <td style={sellerTdStyle}>
                        <span style={getStatusBadgeStyle(seller.status)}>{seller.status}</span>
                      </td>
                      <td style={sellerTdStyle}>
                        <span style={getStatusBadgeStyle(moderationStatus)}>{moderationStatus}</span>
                      </td>
                      <td style={{ ...sellerTdStyle, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                          {seller.status === "Pending" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(seller.id || seller._id);
                                }}
                                style={{ ...iconBtnStyle, color: "var(--success)" }}
                                title="Approve"
                                disabled={actionLoading}
                              >
                                <ApproveIcon />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRejectModal(seller);
                                }}
                                style={{ ...iconBtnStyle, color: "var(--danger)" }}
                                title="Reject"
                                disabled={actionLoading}
                              >
                                <RejectIcon />
                              </button>
                            </>
                          )}

                          {seller.status === "Approved" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openSuspendModal(seller);
                              }}
                              style={suspendButtonStyle}
                              title="Suspend seller"
                              disabled={actionLoading}
                            >
                              <SuspendIcon />
                              Suspend
                            </button>
                          )}

                          {seller.status === "Suspended" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReinstateClick(seller);
                              }}
                              style={reinstateButtonStyle}
                              title="Reinstate seller"
                              disabled={actionLoading}
                            >
                              <ReinstateIcon />
                              Reinstate
                            </button>
                          )}

                          {seller.pendingAppeal && (
                            <Link
                              to={getAppealReviewPath(seller.pendingAppeal)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ ...iconBtnStyle, color: "var(--info-text)", display: "inline-flex" }}
                              title="Review appeal"
                            >
                              <ReviewIcon />
                            </Link>
                          )}

                          {canWarn && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openWarningModal(seller);
                              }}
                              style={warnButtonStyle}
                              disabled={actionLoading}
                            >
                              Warn {warningCount + 1}/{MAX_WARNINGS}
                            </button>
                          )}

                          {lowRating && warningCount >= MAX_WARNINGS && seller.status === "Approved" && (
                            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--danger-text)", alignSelf: "center" }}>
                              Final warning limit reached
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {sellers.length > 0 && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
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

        {drawerOpen && selectedSeller && (
          <SellerDetailsDrawer
            seller={selectedSeller}
            onClose={() => setDrawerOpen(false)}
            onApprove={handleApprove}
            onReject={openRejectModal}
            onSuspend={openSuspendModal}
            onReinstate={handleReinstateClick}
            timeline={timeline}
            timelineLoading={timelineLoading}
          />
        )}

        {warningModalOpen && sellerToWarn && (
          <AdminWarningModal
            seller={sellerToWarn}
            onConfirm={handleWarnSellerConfirm}
            onCancel={() => {
              setWarningModalOpen(false);
              setSellerToWarn(null);
            }}
          />
        )}

        {suspendModalOpen && sellerToSuspend && (
          <AdminSuspendModal
            seller={sellerToSuspend}
            loading={actionLoading}
            onConfirm={handleSuspendConfirm}
            onCancel={() => {
              setSuspendModalOpen(false);
              setSellerToSuspend(null);
            }}
          />
        )}

        {rejectModalOpen && selectedSeller && (
          <div style={modalOverlayStyle} onClick={() => setRejectModalOpen(false)}>
            <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Reject Seller: {selectedSeller.businessName}
              </h3>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Please provide a reason for rejection
              </p>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={fieldLabelStyle}>Rejection Reason</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                  disabled={actionLoading}
                />
              </div>
              <div style={modalActionRowStyle}>
                <button style={secondaryButtonStyle} onClick={() => setRejectModalOpen(false)} disabled={actionLoading}>
                  Cancel
                </button>
                <button style={dangerButtonStyle} onClick={handleRejectSubmit} disabled={actionLoading}>
                  {actionLoading ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={Boolean(reinstateTarget)}
          onClose={() => setReinstateTarget(null)}
          onConfirm={handleReinstateConfirm}
          title="Reinstate this seller?"
          message={
            reinstateTarget
              ? `Reinstate ${reinstateTarget.businessName}? Warning count will reset to 0, warning history will remain, and products will not be auto-republished.`
              : ""
          }
          confirmLabel="Reinstate"
          cancelLabel="Cancel"
          variant="danger"
          loading={actionLoading}
        />
      </div>
    </div>
  );
};

const sellerThStyle = {
  padding: "0.75rem 1.25rem",
  textAlign: "left",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const sellerTdStyle = {
  padding: "0.75rem 1.25rem",
  fontSize: "0.9rem",
  color: "var(--text-primary)",
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

const warnButtonStyle = {
  background: "var(--danger)",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "0.4rem 0.8rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
};

// Labeled outline-style buttons so moderation actions are clearly visible
// instead of ambiguous icon-only ghost buttons.
const suspendButtonStyle = {
  background: "transparent",
  color: "var(--danger)",
  border: "1px solid var(--danger)",
  borderRadius: "6px",
  padding: "0.4rem 0.8rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
};

const reinstateButtonStyle = {
  background: "transparent",
  color: "var(--success)",
  border: "1px solid var(--success)",
  borderRadius: "6px",
  padding: "0.4rem 0.8rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
};

const actionButtonStyle = {
  flex: "1 1 180px",
  padding: "0.75rem",
  borderRadius: "8px",
  border: "none",
  color: "#fff",
  fontSize: "0.95rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const closeButtonStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "0.5rem",
  color: "var(--text-secondary)",
};

const sectionCardStyle = {
  background: "var(--bg-secondary)",
  borderRadius: "12px",
  padding: "1.5rem",
  marginBottom: "1.5rem",
  border: "1px solid var(--border)",
};

const timelineCardStyle = {
  padding: "0.75rem",
  background: "var(--surface)",
  borderRadius: "8px",
  border: "1px solid var(--border)",
};

const lowRatingBadgeStyle = {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--danger-text)",
  background: "var(--danger-bg)",
  padding: "2px 8px",
  borderRadius: "4px",
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
  maxWidth: "500px",
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

const noticeTextStyle = {
  margin: "0.35rem 0 0",
  fontSize: "0.85rem",
  lineHeight: 1.5,
};

const appealNoticeStyle = (type) => ({
  background: type === "danger" ? "var(--danger-bg)" : "var(--info-bg)",
  color: type === "danger" ? "var(--danger-text)" : "var(--info-text)",
  borderRadius: "8px",
  padding: "0.85rem",
  marginTop: "0.75rem",
  border: "1px solid var(--border)",
});

const inlineLinkButtonStyle = {
  display: "inline-block",
  marginTop: "0.75rem",
  padding: "0.45rem 0.75rem",
  borderRadius: "6px",
  background: "var(--surface)",
  color: "var(--text-primary)",
  textDecoration: "none",
  fontSize: "0.8rem",
  fontWeight: 700,
};

export default SellerApprovalPage;

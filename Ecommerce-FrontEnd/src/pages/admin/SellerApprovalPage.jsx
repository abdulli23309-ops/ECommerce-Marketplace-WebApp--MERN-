import { useState, useEffect } from "react";
import {
  getSellers,
  approveSeller,
  rejectSeller,
  warnSeller,
} from "../../services/adminService";
import { getImageUrl } from "../../utils/imageHelper";
import { getStatusBadgeStyle } from "../../utils/statusBadge";
import {
  SELLER_LOW_RATING_THRESHOLD,
  MAX_WARNINGS,
} from "../../utils/warningThresholds";

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
      alert("Please select or enter a warning reason.");
      return;
    }
    onConfirm(finalReason);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "2rem",
          width: "90%",
          maxWidth: "500px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Issue Warning
        </h3>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Seller: <strong>{seller?.businessName}</strong>
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Warning Reason
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
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
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Custom Reason
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter your custom warning reason..."
              rows={3}
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
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-secondary)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--danger)",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Issue Warning
          </button>
        </div>
      </div>
    </div>
  );
};

// Seller Details Drawer Component
const SellerDetailsDrawer = ({ seller, onClose, onApprove, onReject }) => {
  if (!seller) return null;

  const rating = Number(seller.averageRating ?? seller.avgRating ?? 0);
  const lowRating = seller.lowRatingStatus === true || (rating > 0 && rating < SELLER_LOW_RATING_THRESHOLD);
  const warningCount = seller.warningCount || 0;

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
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }
          `}
        </style>

        {/* Header */}
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
              Review seller information and take action
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
              color: "var(--text-secondary)",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "2rem" }}>
          {/* Logo and Business Name */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              border: "1px solid var(--border)",
            }}
          >
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
                <span style={getStatusBadgeStyle(seller.status)}>{seller.status}</span>
              </div>
            </div>
          </div>

          {/* Rating & Warning Status */}
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

          {/* Contact Info */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              border: "1px solid var(--border)",
            }}
          >
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
              Contact Information
            </h4>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <InfoRow label="Full Name" value={seller.fullName || seller.user?.name || "—"} />
              <InfoRow label="Email" value={seller.email || seller.user?.email || "—"} />
              <InfoRow label="Phone" value={seller.phone || "—"} />
              <InfoRow label="City" value={seller.city || "—"} />
            </div>
          </div>

          {/* Business Info */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              border: "1px solid var(--border)",
            }}
          >
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
              Business Information
            </h4>
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
          </div>

          {/* Warning History */}
          {seller.warningHistory && seller.warningHistory.length > 0 && (
            <div
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.5rem",
                border: "1px solid var(--border)",
              }}
            >
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
                Warning History
              </h4>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {seller.warningHistory.map((warning, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "0.75rem",
                      background: "var(--surface)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                      <strong>Warning {idx + 1}:</strong> {warning.reason || "No reason provided"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {new Date(warning.warnedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {seller.status === "Pending" && (
            <div
              style={{
                display: "flex",
                gap: "1rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                onClick={() => onApprove(seller.id || seller._id)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--success)",
                  color: "#fff",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Approve Seller
              </button>
              <button
                onClick={() => onReject(seller)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--danger)",
                  color: "#fff",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Reject Seller
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Info Row Component
const InfoRow = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(sellers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSellers = sellers.slice(startIndex, startIndex + itemsPerPage);

  const loadSellers = async () => {
    setLoading(true);
    try {
      const { items } = await getSellers();
      setSellers(items || []);
    } catch (err) {
      console.error(err);
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

  const handleApprove = async (sellerId) => {
    await approveSeller(sellerId);
    loadSellers();
    setDrawerOpen(false);
  };

  const openRejectModal = (seller) => {
    setSelectedSeller(seller);
    setRejectReason("");
    setRejectModalOpen(true);
    setDrawerOpen(false);
  };

  const handleRejectSubmit = async () => {
    if (!selectedSeller) return;
    await rejectSeller(selectedSeller.id, rejectReason);
    setRejectModalOpen(false);
    loadSellers();
  };

  const openDetailDrawer = (seller) => {
    setSelectedSeller(seller);
    setDrawerOpen(true);
  };

  const openWarningModal = (seller) => {
    setSellerToWarn(seller);
    setWarningModalOpen(true);
  };

  const handleWarnSellerConfirm = async (reason) => {
    if (!sellerToWarn) return;

    try {
      await warnSeller(sellerToWarn.id, reason);
      setWarningModalOpen(false);
      setSellerToWarn(null);
      await loadSellers();
    } catch (err) {
      console.error("Failed to warn seller", err);
      alert(err.response?.data?.message || "Could not issue warning.");
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg-secondary)", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Seller Approval & Moderation
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Review seller applications, manage warnings, and moderate seller accounts.
          </p>
        </div>

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
                  <th style={sellerThStyle}>Status</th>
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
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--danger-text)",
                                background: "var(--danger-bg)",
                                padding: "2px 8px",
                                borderRadius: "4px",
                              }}
                            >
                              Low Rating {rating.toFixed(1)}
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                              }}
                            >
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
                              >
                                <RejectIcon />
                              </button>
                            </>
                          )}

                          {canWarn && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openWarningModal(seller);
                              }}
                              style={{
                                background: "var(--danger)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                padding: "0.4rem 0.8rem",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Warn {warningCount + 1}/{MAX_WARNINGS}
                            </button>
                          )}

                          {lowRating && warningCount >= MAX_WARNINGS && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "var(--danger-text)",
                                alignSelf: "center",
                              }}
                            >
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

        {/* Seller Details Drawer */}
        {drawerOpen && selectedSeller && (
          <SellerDetailsDrawer
            seller={selectedSeller}
            onClose={() => setDrawerOpen(false)}
            onApprove={handleApprove}
            onReject={openRejectModal}
          />
        )}

        {/* Warning Modal */}
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

        {/* REJECT REASON MODAL */}
        {rejectModalOpen && selectedSeller && (
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setRejectModalOpen(false)}
          >
            <div
              style={{
                background: "var(--surface)",
                color: "var(--text-primary)",
                borderRadius: "16px",
                padding: "2rem",
                maxWidth: "500px",
                width: "90%",
                border: "1px solid var(--border)",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
                Reject Seller: {selectedSeller.businessName}
              </h3>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Please provide a reason for rejection
              </p>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  Rejection Reason
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
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
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
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
                  onClick={() => setRejectModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--danger)",
                    color: "#fff",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={handleRejectSubmit}
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
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

const detailItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.3rem 0",
  borderBottom: "1px dashed var(--border)",
};

const detailLabel = {
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "var(--text-secondary)",
};

const detailValue = {
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "var(--text-primary)",
  textAlign: "right",
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

export default SellerApprovalPage;
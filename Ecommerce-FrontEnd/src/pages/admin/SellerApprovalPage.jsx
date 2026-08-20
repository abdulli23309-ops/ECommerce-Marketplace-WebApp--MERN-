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

const SellerApprovalPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

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
    setModalOpen(false);
  };

  const openRejectModal = (seller) => {
    setSelectedSeller(seller);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedSeller) return;
    await rejectSeller(selectedSeller.id, rejectReason);
    setRejectModalOpen(false);
    setModalOpen(false);
    loadSellers();
  };

  const openDetailModal = (seller) => {
    setSelectedSeller(seller);
    setModalOpen(true);
  };

  const handleWarnSeller = async (seller) => {
    const reason = window.prompt(
      `Issue warning for "${seller.businessName}"?\n\nEnter reason (optional):`
    );

    if (reason === null) return;

    try {
      await warnSeller(seller.id, reason || "");
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
                    rating > 0 && rating < SELLER_LOW_RATING_THRESHOLD;
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
                      onClick={() => openDetailModal(seller)}
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
                                handleWarnSeller(seller);
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

        {/* DETAIL MODAL */}
        {modalOpen && selectedSeller && (
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setModalOpen(false)}
          >
            <div
              style={{
                background: "var(--surface)",
                color: "var(--text-primary)",
                borderRadius: "16px",
                padding: "2rem",
                width: "90%",
                maxWidth: "600px",
                maxHeight: "85vh",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Seller Details</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-secondary)" }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", alignItems: "center" }}>
                {selectedSeller.storeLogoUrl ? (
                  <img
                    src={getImageUrl(selectedSeller.storeLogoUrl)}
                    alt="Logo"
                    style={{ width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover", border: "1px solid var(--border)" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "12px",
                      background: "var(--bg-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    No Logo
                  </div>
                )}
                <div>
                  <h4 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 700 }}>
                    {selectedSeller.businessName}
                  </h4>
                  <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                    {selectedSeller.storeName || "Store not yet created"}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div>
                  <h5 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--border)" }}>
                    Contact Info
                  </h5>
                  <div style={detailItemStyle}>
                    <span style={detailLabel}>Full Name</span>
                    <span style={detailValue}>{selectedSeller.fullName || selectedSeller.user?.name || "—"}</span>
                  </div>
                  <div style={detailItemStyle}>
                    <span style={detailLabel}>Email</span>
                    <span style={detailValue}>{selectedSeller.email || selectedSeller.user?.email || "—"}</span>
                  </div>
                  <div style={detailItemStyle}>
                    <span style={detailLabel}>Phone</span>
                    <span style={detailValue}>{selectedSeller.phone || "—"}</span>
                  </div>
                  <div style={detailItemStyle}>
                    <span style={detailLabel}>City</span>
                    <span style={detailValue}>{selectedSeller.city || "—"}</span>
                  </div>
                </div>

                <div>
                  <h5 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "2px solid var(--border)" }}>
                    Business Info
                  </h5>
                  <div style={detailItemStyle}>
                    <span style={detailLabel}>Address</span>
                    <span style={detailValue}>{selectedSeller.address || "—"}</span>
                  </div>
                  <div style={detailItemStyle}>
                    <span style={detailLabel}>Tax ID</span>
                    <span style={detailValue}>{selectedSeller.taxId || "—"}</span>
                  </div>
                  {selectedSeller.storeDescription && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <span style={detailLabel}>Store Description</span>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        {selectedSeller.storeDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedSeller.status === "Pending" && (
                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <button
                    onClick={() => handleApprove(selectedSeller.id || selectedSeller._id)}
                    style={{
                      padding: "0.5rem 1.25rem",
                      borderRadius: "6px",
                      border: "none",
                      background: "var(--success)",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      openRejectModal(selectedSeller);
                    }}
                    style={{
                      padding: "0.5rem 1.25rem",
                      borderRadius: "6px",
                      border: "none",
                      background: "var(--danger)",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REJECT REASON MODAL */}
        {rejectModalOpen && selectedSeller && (
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setRejectModalOpen(false)}
          >
            <div
              style={{
                background: "var(--surface)",
                color: "var(--text-primary)",
                borderRadius: "12px",
                padding: "2rem",
                maxWidth: "400px",
                width: "90%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Reject Seller: {selectedSeller.businessName}</h3>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button className="btn-primary" onClick={handleRejectSubmit}>
                  Confirm Reject
                </button>
                <button className="btn-edit-profile" onClick={() => setRejectModalOpen(false)}>
                  Cancel
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
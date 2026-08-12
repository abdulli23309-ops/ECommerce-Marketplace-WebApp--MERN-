import { useState, useEffect } from "react";
import { getSellers, approveSeller, rejectSeller } from "../../services/adminService";
import { getImageUrl } from "../../utils/imageHelper";

const statusBadgeStyle = (status) => {
  const base = { display: "inline-block", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 };
  switch (status) {
    case "Approved": return { ...base, backgroundColor: "#dcfce7", color: "#166534" };
    case "Pending": return { ...base, backgroundColor: "#fef3c7", color: "#92400e" };
    case "Rejected": return { ...base, backgroundColor: "#fee2e2", color: "#991b1b" };
    default: return { ...base, backgroundColor: "#f3f4f6", color: "#1f2937" };
  }
};

const ApproveIcon = () => ( <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> );
const RejectIcon = () => ( <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> );

const SellerApprovalPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const loadSellers = async () => {
    setLoading(true);
    try {
      const { items } = await getSellers();
      setSellers(items || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadSellers(); }, []);

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

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>Seller Approval</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>Review and approve seller applications</p>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading sellers...</div>
          ) : sellers.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No sellers to review.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Business Name</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left" }}>Owner</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr
                    key={seller.id}
                    style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.15s", cursor: "pointer" }}
                    onClick={() => openDetailModal(seller)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", fontWeight: 500, color: "#111827" }}>{seller.businessName}</td>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "#4b5563" }}>{seller.fullName}</td>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "#4b5563" }}>{seller.email}</td>
                    <td style={{ padding: "0.75rem 1.25rem" }}><span style={statusBadgeStyle(seller.status)}>{seller.status}</span></td>
                    <td style={{ padding: "0.75rem 1.25rem", textAlign: "center" }}>
                      {seller.status === "Pending" && (
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                          <button onClick={(e) => { e.stopPropagation(); handleApprove(seller.id); }} style={{ ...iconBtnStyle, color: "#16a34a" }} title="Approve"><ApproveIcon /></button>
                          <button onClick={(e) => { e.stopPropagation(); openRejectModal(seller); }} style={{ ...iconBtnStyle, color: "#dc2626" }} title="Reject"><RejectIcon /></button>
                        </div>
                      )}
                      {seller.status !== "Pending" && <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ============ DETAIL MODAL (ENHANCED) ============ */}
        {modalOpen && selectedSeller && (
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setModalOpen(false)}
          >
            <div
              style={{ background: "#fff", borderRadius: "16px", padding: "2rem", width: "90%", maxWidth: "600px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Seller Details</h3>
                <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#6b7280" }}>×</button>
              </div>

              {/* Logo & Business Name */}
              <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", alignItems: "center" }}>
                {selectedSeller.storeLogoUrl ? (
                  <img src={getImageUrl(selectedSeller.storeLogoUrl)} alt="Logo" style={{ width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover", border: "1px solid #e5e7eb" }} />
                ) : (
                  <div style={{ width: "80px", height: "80px", borderRadius: "12px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No Logo</div>
                )}
                <div>
                  <h4 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 700 }}>{selectedSeller.businessName}</h4>
                  <p style={{ margin: 0, color: "#4b5563" }}>{selectedSeller.storeName || "Store not yet created"}</p>
                </div>
              </div>

              {/* Two‑column grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                {/* Contact Info */}
                <div>
                  <h5 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "2px solid #f3f4f6" }}>Contact Info</h5>
                  <div style={detailItemStyle}>
                    <span style={detailLabel}>Full Name</span>
                    <span style={detailValue}>{selectedSeller.fullName}</span>
                  </div>
                  <div style={detailItemStyle}>
                    <span style={detailLabel}>Email</span>
                    <span style={detailValue}>{selectedSeller.email}</span>
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

                {/* Business Info */}
                <div>
                  <h5 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "2px solid #f3f4f6" }}>Business Info</h5>
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
                      <p style={{ fontSize: "0.85rem", color: "#4b5563", marginTop: "0.25rem" }}>
                        {selectedSeller.storeDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              {selectedSeller.status === "Pending" && (
                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
                  <button
                    onClick={() => handleApprove(selectedSeller.id)}
                    style={{ padding: "0.5rem 1.25rem", borderRadius: "6px", border: "none", background: "#16a34a", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => { setModalOpen(false); openRejectModal(selectedSeller); }}
                    style={{ padding: "0.5rem 1.25rem", borderRadius: "6px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ REJECT REASON MODAL (unchanged) ============ */}
        {rejectModalOpen && selectedSeller && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setRejectModalOpen(false)}>
            <div style={{ background: "#fff", borderRadius: "12px", padding: "2rem", maxWidth: "400px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
              <h3>Reject Seller: {selectedSeller.businessName}</h3>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-input" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button className="btn-primary" onClick={handleRejectSubmit}>Confirm Reject</button>
                <button className="btn-edit-profile" onClick={() => setRejectModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper styles for the modal details
const detailItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.3rem 0",
  borderBottom: "1px dashed #f3f4f6",
};
const detailLabel = {
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "#6b7280",
};
const detailValue = {
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "#111827",
  textAlign: "right",
};

const iconBtnStyle = {
  background: "transparent", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px",
  color: "#6b7280", transition: "background 0.15s, color 0.15s",
};

export default SellerApprovalPage;
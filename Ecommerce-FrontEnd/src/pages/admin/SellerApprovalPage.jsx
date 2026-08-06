import { useState, useEffect } from "react";
import { getSellers, approveSeller, rejectSeller } from "../../services/adminService";

const rejectionOptions = [
  "Incomplete information",
  "Invalid business name",
  "Store logo missing or inappropriate",
  "Duplicate application",
  "Other",
];

const SellerApprovalPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalSeller, setModalSeller] = useState(null);
  const [rejectReason, setRejectReason] = useState(rejectionOptions[0]);
  const [customReason, setCustomReason] = useState("");

  const loadSellers = async () => {
    setLoading(true);
    try {
      const data = await getSellers();
      setSellers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSellers(); }, []);

  const handleApprove = async (sellerId) => {
    await approveSeller(sellerId);
    loadSellers();
  };

  const openRejectModal = (seller) => {
    setModalSeller(seller);
    setRejectReason(rejectionOptions[0]);
    setCustomReason("");
  };

  const handleRejectSubmit = async () => {
    if (!modalSeller) return;
    const reason = rejectReason === "Other" ? customReason : rejectReason;
    await rejectSeller(modalSeller.id, reason);
    setModalSeller(null);
    loadSellers();
  };

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading sellers...</div>;

  return (
    <div>
      <h2 className="section-title">Seller Approval</h2>
      {sellers.length === 0 ? (
        <div className="empty-state">No sellers to review.</div>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Owner</th>
              <th>Email</th>
              <th>Store</th>
              <th>Logo</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller) => (
              <tr key={seller.id}>
                <td>{seller.businessName}</td>
                <td>{seller.fullName}</td>
                <td>{seller.email}</td>
                <td>{seller.storeName || "—"}</td>
                <td>
                  {seller.storeLogoUrl ? (
                    <img src={seller.storeLogoUrl} alt="Logo" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "0.25rem" }} />
                  ) : "—"}
                </td>
                <td>{seller.status}</td>
                <td>
                  {seller.status === "Pending" && (
                    <>
                      <button className="btn-edit" onClick={() => handleApprove(seller.id)}>Approve</button>
                      <button className="btn-delete" onClick={() => openRejectModal(seller)}>Reject</button>
                    </>
                  )}
                  {seller.status !== "Pending" && "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalSeller && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reject Seller: {modalSeller.businessName}</h3>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <select className="form-input" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
                {rejectionOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            {rejectReason === "Other" && (
              <div className="form-group">
                <label className="form-label">Details</label>
                <textarea className="form-input" rows={3} value={customReason} onChange={(e) => setCustomReason(e.target.value)} />
              </div>
            )}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button className="btn-primary" onClick={handleRejectSubmit}>Confirm Reject</button>
              <button className="btn-edit-profile" onClick={() => setModalSeller(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerApprovalPage;
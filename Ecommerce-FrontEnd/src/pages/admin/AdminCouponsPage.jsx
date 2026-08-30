import React, { useState, useEffect } from "react";
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../services/adminCouponService";
import Pagination from "../../components/common/Pagination";

// ---------- Icons (reused from AdminCategoriesPage) ----------
const EditIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const AddIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const WarningIcon = () => (
  <svg width="36" height="36" fill="none" stroke="var(--danger)" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ---------- Styles ----------
const iconBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "4px",
  color: "var(--text-secondary)",
  transition: "background 0.15s, color 0.15s",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  fontWeight: 600,
  borderBottom: "1px solid var(--border)",
  color: "var(--text-primary)",
};

const tdStyle = {
  padding: "12px 16px",
  color: "var(--text-secondary)",
};

// ---------- Empty form ----------
const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscountAmount: "",
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  isActive: true,
  description: "",
};

// ---------- Main Component ----------
const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ---------- Data loading ----------
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchCoupons({ page, pageSize: 20 });
      setCoupons(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load coupons", err);
      setError("Could not load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  // ---------- Form handling ----------
  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        ...form,
        discountValue:
          form.discountType === "free_delivery" ? 0 : Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscountAmount: form.maxDiscountAmount
          ? Number(form.maxDiscountAmount)
          : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        startsAt: form.startsAt
          ? new Date(form.startsAt).toISOString()
          : new Date().toISOString(),
        expiresAt: new Date(form.expiresAt).toISOString(),
      };

      if (editingId) {
        await updateCoupon(editingId, payload);
      } else {
        await createCoupon(payload);
      }

      resetForm();
      load();
    } catch (err) {
      console.error("Failed to save coupon", err);
      setError(err.response?.data?.message || "Failed to save coupon");
    }
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount ?? "",
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 10) : "",
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : "",
      usageLimit: coupon.usageLimit ?? "",
      isActive: coupon.isActive,
      description: coupon.description || "",
    });
    setShowForm(true);
  };

  // ---------- Delete modal ----------
  const openDeleteModal = (coupon) => {
    setDeleteTarget({ id: coupon._id, code: coupon.code });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCoupon(deleteTarget.id);
      closeDeleteModal();
      load();
    } catch (err) {
      console.error("Failed to delete coupon", err);
      setError("Failed to delete coupon");
      closeDeleteModal();
    }
  };

  // ---------- Render ----------
  return (
    <div
      style={{
        backgroundColor: "var(--bg-secondary)",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "var(--text-primary)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Coupons</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Manage discount codes and promotions
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--primary)",
                color: "var(--primary-contrast)",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "var(--primary-hover)")}
              onMouseLeave={(e) => (e.target.style.background = "var(--primary)")}
            >
              <AddIcon /> Add Coupon
            </button>
          )}
        </div>

        {error && <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>{error}</p>}

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              marginBottom: "2rem",
              background: "var(--surface)",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem" }}>
              {editingId ? "Edit Coupon" : "New Coupon"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <label className="form-label">Code</label>
                <input
                  className="form-input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Discount Type</label>
                <select
                  className="form-input"
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </div>

              {form.discountType !== "free_delivery" && (
                <div>
                  <label className="form-label">
                    {form.discountType === "percentage" ? "Discount Value (%)" : "Discount Value (PKR)"}
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    required={form.discountType !== "free_delivery"}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Min Order Amount</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                />
              </div>

              {form.discountType === "percentage" && (
                <div>
                  <label className="form-label">Max Discount Amount</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Starts At</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Expires At</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Usage Limit</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label className="form-label" style={{ margin: 0 }}>Active</label>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "auto", padding: "0.75rem 1.5rem" }}
              >
                {editingId ? "Update" : "Save"}
              </button>
              <button
                type="button"
                className="btn-remove"
                onClick={resetForm}
                style={{ padding: "0.75rem 1.5rem" }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        <div
          className="table-responsive"
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            boxShadow: "0 1px 3px var(--shadow)",
            border: "1px solid var(--border)",
          }}
        >
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              Loading coupons...
            </div>
          ) : coupons.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              No coupons found.
            </div>
          ) : (
            <>
              <table className="coupons-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                    <th style={thStyle}>Code</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Value</th>
                    <th style={thStyle}>Min Order</th>
                    <th style={thStyle}>Expires</th>
                    <th style={thStyle}>Usage</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon._id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={tdStyle}><strong>{coupon.code}</strong></td>
                      <td style={tdStyle}>
                        {coupon.discountType === "free_delivery"
                          ? "Free Delivery"
                          : coupon.discountType}
                      </td>
                      <td style={tdStyle}>
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}%`
                          : coupon.discountType === "fixed"
                          ? `PKR ${coupon.discountValue}`
                          : "FREE"}
                      </td>
                      <td style={tdStyle}>PKR {coupon.minOrderAmount ?? 0}</td>
                      <td style={tdStyle}>{new Date(coupon.expiresAt).toLocaleDateString()}</td>
                      <td style={tdStyle}>
                        {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                      </td>
                      <td style={tdStyle}>{coupon.isActive ? "Active" : "Inactive"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleEdit(coupon)}
                            style={iconBtnStyle}
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => openDeleteModal(coupon)}
                            style={iconBtnStyle}
                            title="Delete"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-coupon-title"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={closeDeleteModal}
          >
            <div
              style={{
                background: "var(--surface)",
                borderRadius: "16px",
                padding: "2rem",
                maxWidth: "420px",
                width: "90%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <WarningIcon />
              </div>

              <h3
                id="delete-coupon-title"
                style={{
                  textAlign: "center",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "0.5rem",
                }}
              >
                Delete Coupon?
              </h3>

              <p
                style={{
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  marginBottom: "1.5rem",
                }}
              >
                Are you sure you want to delete the coupon <strong>{deleteTarget?.code}</strong>? This action cannot be undone.
              </p>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={closeDeleteModal}
                  style={{
                    flex: 1,
                    padding: "0.6rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  style={{
                    flex: 1,
                    padding: "0.6rem 1rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--danger)",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCouponsPage;
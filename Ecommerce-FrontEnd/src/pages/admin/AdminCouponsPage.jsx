import { useState, useEffect } from "react";
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../services/adminCouponService";
import Pagination from "../../components/common/Pagination";

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

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

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
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : new Date().toISOString(),
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await deleteCoupon(id);
      load();
    } catch (err) {
      console.error("Failed to delete coupon", err);
      setError("Failed to delete coupon");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Coupons</h1>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--primary)",
              color: "var(--primary-contrast)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Add Coupon
          </button>
        )}
      </div>

      {error && <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "2rem", background: "var(--surface)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1rem" }}>{editingId ? "Edit Coupon" : "New Coupon"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label className="form-label">Code</label>
              <input className="form-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Discount Type</label>
              <select className="form-input" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="form-label">Discount Value</label>
              <input className="form-input" type="number" min="0" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Min Order Amount</label>
              <input className="form-input" type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Max Discount Amount</label>
              <input className="form-input" type="number" min="0" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Starts At</label>
              <input className="form-input" type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Expires At</label>
              <input className="form-input" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Usage Limit</label>
              <input className="form-input" type="number" min="0" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <label className="form-label" style={{ margin: 0 }}>Active</label>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0.75rem 1.5rem" }}>{editingId ? "Update" : "Save"}</button>
            <button type="button" className="btn-remove" onClick={resetForm} style={{ padding: "0.75rem 1.5rem" }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading coupons...</p>
      ) : coupons.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No coupons found.</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", background: "var(--surface)", border: "1px solid var(--border)" }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
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
                    <td style={tdStyle}>{coupon.discountType}</td>
                    <td style={tdStyle}>{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `PKR ${coupon.discountValue}`}</td>
                    <td style={tdStyle}>PKR {coupon.minOrderAmount ?? 0}</td>
                    <td style={tdStyle}>{new Date(coupon.expiresAt).toLocaleDateString()}</td>
                    <td style={tdStyle}>{coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}</td>
                    <td style={tdStyle}>{coupon.isActive ? "Active" : "Inactive"}</td>
                    <td style={tdStyle}>
                      <button onClick={() => handleEdit(coupon)} style={{ marginRight: "8px", cursor: "pointer", background: "none", border: "none", color: "var(--primary)", textDecoration: "underline" }}>Edit</button>
                      <button onClick={() => handleDelete(coupon._id)} style={{ cursor: "pointer", background: "none", border: "none", color: "var(--danger)", textDecoration: "underline" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
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

export default AdminCouponsPage;
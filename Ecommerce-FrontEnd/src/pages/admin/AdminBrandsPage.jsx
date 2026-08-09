import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";

const iconBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "4px",
  color: "#6b7280",
  transition: "background 0.15s, color 0.15s",
};

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

const AdminBrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [error, setError] = useState(null);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/brands");
      const brandsData = res.data?.data || [];
      setBrands(brandsData.map((b) => ({ id: b._id, name: b.name })));
    } catch (err) {
      console.error("Failed to load brands", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const openAddBrand = () => {
    setEditingBrand(null);
    setForm({ name: "" });
    setError(null);
    setModalOpen(true);
  };

  const openEditBrand = (brand) => {
    setEditingBrand(brand);
    setForm({ name: brand.name });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingBrand) {
        await axiosInstance.put(`/brands/${editingBrand.id}`, form);
      } else {
        await axiosInstance.post("/brands", form);
      }
      setModalOpen(false);
      fetchBrands();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed.");
    }
  };

  const handleDelete = async (brandId) => {
    if (!window.confirm("Delete this brand?")) return;
    try {
      await axiosInstance.delete(`/brands/${brandId}`);
      fetchBrands();
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete brand.");
    }
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>Brand Management</h1>
            <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>Manage product brands</p>
          </div>
          <button onClick={openAddBrand} style={{
            padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none",
            background: "#111827", color: "#fff", fontWeight: 600, fontSize: "0.9rem",
            cursor: "pointer", transition: "background 0.2s",
          }}
            onMouseEnter={(e) => e.target.style.background = "#1f2937"}
            onMouseLeave={(e) => e.target.style.background = "#111827"}>
            + Add Brand
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : brands.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No brands found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map(brand => (
                  <tr key={brand.id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", fontWeight: 600, color: "#111827" }}>{brand.name}</td>
                    <td style={{ padding: "0.75rem 1.25rem", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        <button onClick={() => openEditBrand(brand)} style={iconBtnStyle} title="Edit"><EditIcon /></button>
                        <button onClick={() => handleDelete(brand.id)} style={{ ...iconBtnStyle, color: "#dc2626" }} title="Delete"><DeleteIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{editingBrand ? "Edit Brand" : "Add Brand"}</h3>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button className="btn-primary" onClick={handleSave}>Save</button>
                <button className="btn-edit-profile" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBrandsPage;
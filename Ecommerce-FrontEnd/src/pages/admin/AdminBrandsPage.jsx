import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";

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
      const msg = err.response?.data?.message || "Save failed.";
      setError(msg);
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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="section-title">Brand Management</h2>
        <button className="add-product-btn" onClick={openAddBrand}>+ Add Brand</button>
      </div>

      {loading ? <p style={{ color: "#666" }}>Loading...</p> :
        brands.length === 0 ? <div className="empty-state">No brands found.</div> :
        <table className="product-table">
          <thead><tr><th>Name</th><th>Actions</th></tr></thead>
          <tbody>
            {brands.map(brand => (
              <tr key={brand.id}>
                <td>{brand.name}</td>
                <td>
                  <button className="btn-edit" onClick={() => openEditBrand(brand)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(brand.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingBrand ? "Edit Brand" : "Add Brand"}</h3>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
  );
};

export default AdminBrandsPage;
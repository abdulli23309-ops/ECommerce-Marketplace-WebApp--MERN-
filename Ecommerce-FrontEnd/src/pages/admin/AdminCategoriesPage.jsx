import React, { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("category");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [error, setError] = useState(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/categories");
      const cats = (res.data?.data || []).map((c) => ({ id: c._id, name: c.name }));
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const toggleExpandCategory = async (catId) => {
    if (expandedCategoryId === catId) { setExpandedCategoryId(null); return; }
    setExpandedCategoryId(catId);
    if (!subCategoriesMap[catId]) {
      try {
        const res = await axiosInstance.get("/subcategories");
        const allSubs = res.data?.data || [];
        const subsForCat = allSubs.filter((s) => s.category === catId || s.category?._id === catId);
        setSubCategoriesMap(prev => ({ ...prev, [catId]: subsForCat.map((s) => ({ id: s._id, name: s.name })) }));
      } catch (err) { console.error(err); }
    }
  };

  const refreshSubCategories = async (catId) => {
    try {
      const res = await axiosInstance.get("/subcategories");
      const allSubs = res.data?.data || [];
      const subsForCat = allSubs.filter((s) => s.category === catId || s.category?._id === catId);
      setSubCategoriesMap(prev => ({ ...prev, [catId]: subsForCat.map((s) => ({ id: s._id, name: s.name })) }));
    } catch (err) { console.error(err); }
  };

  const openAddCategory = () => {
    setModalMode("category");
    setEditingCategory(null);
    setEditingSubCategory(null);
    setForm({ name: "" });
    setError(null);
    setModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setModalMode("category");
    setEditingCategory(cat);
    setEditingSubCategory(null);
    setForm({ name: cat.name });
    setError(null);
    setModalOpen(true);
  };

  const handleCategorySave = async () => {
    try {
      if (editingCategory) {
        await axiosInstance.put(`/categories/${editingCategory.id}`, form);
      } else {
        await axiosInstance.post("/categories", form);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed.");
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Delete this category and all its subcategories?")) return;
    try {
      await axiosInstance.delete(`/categories/${catId}`);
      fetchCategories();
      setSubCategoriesMap(prev => { const copy = { ...prev }; delete copy[catId]; return copy; });
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete category.");
    }
  };

  const openAddSubCategory = (catId) => {
    setModalMode("subcategory");
    setEditingCategory({ id: catId });
    setEditingSubCategory(null);
    setForm({ name: "" });
    setError(null);
    setModalOpen(true);
  };

  const openEditSubCategory = (catId, sub) => {
    setModalMode("subcategory");
    setEditingCategory({ id: catId });
    setEditingSubCategory(sub);
    setForm({ name: sub.name });
    setError(null);
    setModalOpen(true);
  };

  const handleSubCategorySave = async () => {
    const catId = editingCategory?.id;
    if (!catId) return;
    const payload = { name: form.name, category: catId };
    try {
      if (editingSubCategory) {
        await axiosInstance.put(`/subcategories/${editingSubCategory.id}`, payload);
      } else {
        await axiosInstance.post("/subcategories", payload);
      }
      setModalOpen(false);
      refreshSubCategories(catId);
    } catch (err) {
      setError(err.response?.data?.message || "Save failed.");
    }
  };

  const handleDeleteSubCategory = async (catId, subId) => {
    if (!window.confirm("Delete this subcategory?")) return;
    try {
      await axiosInstance.delete(`/subcategories/${subId}`);
      refreshSubCategories(catId);
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete subcategory.");
    }
  };

  return (
    <div>
      <h2 className="section-title">Category Management</h2>
      <div style={{ marginBottom: "1rem" }}>
        <button className="add-product-btn" onClick={openAddCategory}>+ Add Category</button>
      </div>

      {loading ? <p style={{ color: "#666" }}>Loading...</p> :
        categories.length === 0 ? <div className="empty-state">No categories found.</div> :
        <table className="product-table">
          <thead><tr><th>Name</th><th>Actions</th></tr></thead>
          <tbody>
            {categories.map(cat => (
              <React.Fragment key={cat.id}>
                <tr>
                  <td>
                    <span style={{ cursor: "pointer", fontWeight: 600, color: "#000" }}
                      onClick={() => toggleExpandCategory(cat.id)}>
                      {expandedCategoryId === cat.id ? "▼" : "▶"} {cat.name}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => openEditCategory(cat)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDeleteCategory(cat.id)}>Delete</button>
                    <button className="btn-edit" onClick={() => openAddSubCategory(cat.id)} style={{ marginLeft: "0.5rem" }}>+ Subcategory</button>
                  </td>
                </tr>
                {expandedCategoryId === cat.id && (subCategoriesMap[cat.id] || []).map(sub => (
                  <tr key={sub.id} style={{ background: "#f9f9f9" }}>
                    <td style={{ paddingLeft: "2rem" }}>{sub.name}</td>
                    <td>
                      <button className="btn-edit" onClick={() => openEditSubCategory(cat.id, sub)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDeleteSubCategory(cat.id, sub.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      }

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {modalMode === "subcategory"
                ? (editingSubCategory ? "Edit Subcategory" : "Add Subcategory")
                : (editingCategory ? "Edit Category" : "Add Category")}
            </h3>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            {error && <p className="error-text">{error}</p>}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button className="btn-primary"
                onClick={modalMode === "subcategory" ? handleSubCategorySave : handleCategorySave}>
                Save
              </button>
              <button className="btn-edit-profile" onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
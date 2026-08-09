import React, { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";

// ---------- Icon components ----------
const EditIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const DeleteIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const AddIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// ---------- Styles ----------
const iconBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "4px",
  color: "#6b7280",
  transition: "background 0.15s, color 0.15s",
};

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

  // ---------- Modal handlers ----------
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
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>Category Management</h1>
            <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>Organize your product catalog</p>
          </div>
          <button onClick={openAddCategory} style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "8px",
            border: "none",
            background: "#111827",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
            onMouseEnter={(e) => e.target.style.background = "#1f2937"}
            onMouseLeave={(e) => e.target.style.background = "#111827"}
          >
            + Add Category
          </button>
        </div>

        {/* Data card */}
        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : categories.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No categories found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "right", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => {
                  const isExpanded = expandedCategoryId === cat.id;
                  const subs = subCategoriesMap[cat.id] || [];
                  return (
                    <React.Fragment key={cat.id}>
                      {/* Parent row */}
                      <tr
                        style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.15s" }}
                        onClick={() => toggleExpandCategory(cat.id)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <td style={{ padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-flex" }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                          <span style={{ fontWeight: 600, color: "#111827" }}>{cat.name}</span>
                        </td>
                        <td style={{ padding: "0.75rem 1.25rem", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }} style={iconBtnStyle} title="Edit"><EditIcon /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} style={iconBtnStyle} title="Delete"><DeleteIcon /></button>
                            <button onClick={(e) => { e.stopPropagation(); openAddSubCategory(cat.id); }} style={{ ...iconBtnStyle, color: "#16a34a" }} title="Add Subcategory"><AddIcon /></button>
                          </div>
                        </td>
                      </tr>
                      {/* Child rows */}
                      {isExpanded && subs.map(sub => (
                        <tr key={sub.id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#fcfcfd" }}>
                          <td style={{ padding: "0.75rem 1.25rem", paddingLeft: "3rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ width: "16px", height: "16px", borderLeft: "2px solid #e5e7eb", borderBottom: "2px solid #e5e7eb", transform: "translateY(-4px)" }}></span>
                            <span style={{ color: "#374151" }}>{sub.name}</span>
                          </td>
                          <td style={{ padding: "0.75rem 1.25rem", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                              <button onClick={() => openEditSubCategory(cat.id, sub)} style={iconBtnStyle} title="Edit"><EditIcon /></button>
                              <button onClick={() => handleDeleteSubCategory(cat.id, sub.id)} style={iconBtnStyle} title="Delete"><DeleteIcon /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal – fully intact */}
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
    </div>
  );
};

export default AdminCategoriesPage;
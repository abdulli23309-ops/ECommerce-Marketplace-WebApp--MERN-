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
const WarningIcon = () => (
  <svg width="36" height="36" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'category'|'subcategory', id, name, parentId? }

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

  // ---------- Modal handlers (add/edit) ----------
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

  // ---------- Delete confirmation handlers ----------
  const openDeleteCategoryModal = (cat) => {
    setDeleteTarget({ type: "category", id: cat.id, name: cat.name });
    setIsDeleteModalOpen(true);
  };

  const openDeleteSubCategoryModal = (catId, sub) => {
    setDeleteTarget({ type: "subcategory", id: sub.id, name: sub.name, parentId: catId });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "category") {
        await axiosInstance.delete(`/categories/${deleteTarget.id}`);
        fetchCategories();
        setSubCategoriesMap(prev => {
          const copy = { ...prev };
          delete copy[deleteTarget.id];
          return copy;
        });
      } else if (deleteTarget.type === "subcategory") {
        await axiosInstance.delete(`/subcategories/${deleteTarget.id}`);
        refreshSubCategories(deleteTarget.parentId);
      }
      closeDeleteModal();
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete.");
      closeDeleteModal();
    }
  };

  // Subcategory CRUD
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
                            <button onClick={(e) => { e.stopPropagation(); openDeleteCategoryModal(cat); }} style={iconBtnStyle} title="Delete"><DeleteIcon /></button>
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
                              <button onClick={() => openDeleteSubCategoryModal(cat.id, sub)} style={iconBtnStyle} title="Delete"><DeleteIcon /></button>
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

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="modal-overlay" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setModalOpen(false)}>
            <div className="modal-content" style={{ background: "#fff", borderRadius: "12px", padding: "2rem", maxWidth: "420px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>
                {modalMode === "subcategory"
                  ? (editingSubCategory ? "Edit Subcategory" : "Add Subcategory")
                  : (editingCategory ? "Edit Category" : "Add Category")}
              </h3>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              {error && <p className="error-text" style={{ color: "#dc2626", marginTop: "0.5rem" }}>{error}</p>}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button className="btn-primary" style={{ padding: "0.5rem 1.25rem", borderRadius: "6px", border: "none", background: "#111827", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                  onClick={modalMode === "subcategory" ? handleSubCategorySave : handleCategorySave}>
                  Save
                </button>
                <button className="btn-edit-profile" style={{ padding: "0.5rem 1.25rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }} onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={closeDeleteModal}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "2rem", maxWidth: "420px", width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <WarningIcon />
              </div>
              <h3 style={{ textAlign: "center", fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
                Delete {deleteTarget?.type === "category" ? "Category" : "Subcategory"}?
              </h3>
              <p style={{ textAlign: "center", color: "#6b7280", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                {deleteTarget?.type === "category"
                  ? "Are you sure you want to delete this category and all its subcategories? This action cannot be undone."
                  : "Are you sure you want to delete this subcategory? This action cannot be undone."}
              </p>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button onClick={closeDeleteModal} style={{ flex: 1, padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={confirmDelete} style={{ flex: 1, padding: "0.6rem 1rem", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
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

export default AdminCategoriesPage;
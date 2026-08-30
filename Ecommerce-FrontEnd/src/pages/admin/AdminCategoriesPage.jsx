import React, { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toastError } from "../../components/common/Toast";

const EditIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const AddIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const WarningIcon = () => (
  <svg width="36" height="36" fill="none" stroke="var(--danger)" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const iconBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "4px",
  color: "var(--text-secondary)",
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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ---------- FRONTEND-ONLY PAGINATION ----------
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(categories.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCategories = categories.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Ensure current page remains valid after deletes or data refreshes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [categories.length, currentPage, totalPages]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/categories");
      const cats = (res.data?.data || []).map((c) => ({
        id: c._id,
        name: c.name,
      }));
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpandCategory = async (catId) => {
    if (expandedCategoryId === catId) {
      setExpandedCategoryId(null);
      return;
    }

    setExpandedCategoryId(catId);

    if (!subCategoriesMap[catId]) {
      try {
        const res = await axiosInstance.get("/subcategories");
        const allSubs = res.data?.data || [];
        const subsForCat = allSubs.filter(
          (s) => s.category === catId || s.category?._id === catId
        );
        setSubCategoriesMap((prev) => ({
          ...prev,
          [catId]: subsForCat.map((s) => ({ id: s._id, name: s.name })),
        }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const refreshSubCategories = async (catId) => {
    try {
      const res = await axiosInstance.get("/subcategories");
      const allSubs = res.data?.data || [];
      const subsForCat = allSubs.filter(
        (s) => s.category === catId || s.category?._id === catId
      );
      setSubCategoriesMap((prev) => ({
        ...prev,
        [catId]: subsForCat.map((s) => ({ id: s._id, name: s.name })),
      }));
    } catch (err) {
      console.error(err);
    }
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

  const openDeleteCategoryModal = (cat) => {
    setDeleteTarget({ type: "category", id: cat.id, name: cat.name });
    setIsDeleteModalOpen(true);
  };

  const openDeleteSubCategoryModal = (catId, sub) => {
    setDeleteTarget({
      type: "subcategory",
      id: sub.id,
      name: sub.name,
      parentId: catId,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  // Escape-to-close + body scroll lock for Delete modal
  useEffect(() => {
    if (!isDeleteModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") closeDeleteModal();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [isDeleteModalOpen]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "category") {
        await axiosInstance.delete(`/categories/${deleteTarget.id}`);
        fetchCategories();
        setSubCategoriesMap((prev) => {
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
      toastError(err.response?.data?.message || "Cannot delete.");
      closeDeleteModal();
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

  // Escape-to-close + body scroll lock for Add/Edit modal
  useEffect(() => {
    if (!modalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [modalOpen]);

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
    <div
      style={{
        backgroundColor: "var(--bg-secondary)",
        minHeight: "100vh",
        padding: "2rem",
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
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Category Management
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Organize your product catalog
            </p>
          </div>

          <button
            onClick={openAddCategory}
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
            onMouseEnter={(e) =>
              (e.target.style.background = "var(--primary-hover)")
            }
            onMouseLeave={(e) =>
              (e.target.style.background = "var(--primary)")
            }
          >
            + Add Category
          </button>
        </div>

        {/* Data card */}
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
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              Loading...
            </div>
          ) : categories.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              No categories found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="categories-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "right",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentCategories.map((cat) => {
                  const isExpanded = expandedCategoryId === cat.id;
                  const subs = subCategoriesMap[cat.id] || [];

                  return (
                    <React.Fragment key={cat.id}>
                      {/* Parent row */}
                      <tr
                        style={{
                          borderBottom: "1px solid var(--border)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onClick={() => toggleExpandCategory(cat.id)}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--surface-hover)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--surface)")
                        }
                      >
                        <td
                          style={{
                            padding: "0.75rem 1.25rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              transform: isExpanded
                                ? "rotate(90deg)"
                                : "rotate(0deg)",
                              transition: "transform 0.2s",
                              display: "inline-flex",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {cat.name}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1.25rem",
                            textAlign: "right",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditCategory(cat);
                              }}
                              style={iconBtnStyle}
                              title="Edit"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteCategoryModal(cat);
                              }}
                              style={iconBtnStyle}
                              title="Delete"
                            >
                              <DeleteIcon />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAddSubCategory(cat.id);
                              }}
                              style={{ ...iconBtnStyle, color: "var(--success)" }}
                              title="Add Subcategory"
                            >
                              <AddIcon />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Child rows */}
                      {isExpanded &&
                        subs.map((sub) => (
                          <tr
                            key={sub.id}
                            style={{
                              borderBottom: "1px solid var(--border)",
                              backgroundColor: "var(--surface-elevated)",
                            }}
                          >
                            <td
                              style={{
                                padding: "0.75rem 1.25rem",
                                paddingLeft: "3rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <span
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  borderLeft: "2px solid var(--border)",
                                  borderBottom: "2px solid var(--border)",
                                  transform: "translateY(-4px)",
                                }}
                              ></span>
                              <span style={{ color: "var(--text-secondary)" }}>
                                {sub.name}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1.25rem",
                                textAlign: "right",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: "0.5rem",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    openEditSubCategory(cat.id, sub)
                                  }
                                  style={iconBtnStyle}
                                  title="Edit"
                                >
                                  <EditIcon />
                                </button>
                                <button
                                  onClick={() =>
                                    openDeleteSubCategoryModal(cat.id, sub)
                                  }
                                  style={iconBtnStyle}
                                  title="Delete"
                                >
                                  <DeleteIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Frontend-only pagination */}
        {categories.length > 0 && totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            <button
              className="page-btn"
              disabled={currentPage <= 1}
              onClick={() =>
                setCurrentPage((prev) => Math.max(1, prev - 1))
              }
            >
              Previous
            </button>

            <span
              style={{
                alignSelf: "center",
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
              }}
            >
              Page {currentPage} of {totalPages}
            </span>

            <button
              className="page-btn"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
            >
              Next
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setModalOpen(false)}
          >
            <div
              className="modal-content"
              style={{
                background: "var(--surface)",
                borderRadius: "12px",
                padding: "2rem",
                maxWidth: "420px",
                width: "90%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                id="category-modal-title"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: "1.5rem",
                }}
              >
                {modalMode === "subcategory"
                  ? editingSubCategory
                    ? "Edit Subcategory"
                    : "Add Subcategory"
                  : editingCategory
                  ? "Edit Category"
                  : "Add Category"}
              </h3>

              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              {error && (
                <p
                  className="error-text"
                  style={{ color: "var(--danger)", marginTop: "0.5rem" }}
                >
                  {error}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  className="btn-primary"
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "6px",
                    border: "none",
                    background: "var(--primary)",
                    color: "var(--primary-contrast)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={
                    modalMode === "subcategory"
                      ? handleSubCategorySave
                      : handleCategorySave
                  }
                >
                  Save
                </button>

                <button
                  className="btn-edit-profile"
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
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
                id="delete-modal-title"
                style={{
                  textAlign: "center",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "0.5rem",
                }}
              >
                Delete{" "}
                {deleteTarget?.type === "category"
                  ? "Category"
                  : "Subcategory"}
                ?
              </h3>

              <p
                style={{
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  marginBottom: "1.5rem",
                }}
              >
                {deleteTarget?.type === "category"
                  ? "Are you sure you want to delete this category and all its subcategories? This action cannot be undone."
                  : "Are you sure you want to delete this subcategory? This action cannot be undone."}
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

export default AdminCategoriesPage;
import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import { toastError } from "../../components/common/Toast";

const iconBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "4px",
  color: "var(--text-secondary)",
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

const WarningIcon = () => (
  <svg width="36" height="36" fill="none" stroke="var(--danger)" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AdminBrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [error, setError] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/brands/paginated", {
        params: { page, pageSize: 10 },
      });

      const payload = res.data?.data || {};
      const items = payload.items || [];

      setBrands(items.map((b) => ({ id: b._id, name: b.name })));
      setTotalPages(payload.totalPages || 1);
    } catch (err) {
      console.error("Failed to load brands", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [page]);

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

  const openDeleteModal = (brand) => {
    setBrandToDelete(brand);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBrandToDelete(null);
  };

  const confirmDelete = async () => {
    if (!brandToDelete) return;
    try {
      await axiosInstance.delete(`/brands/${brandToDelete.id}`);
      closeDeleteModal();

      if (brands.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchBrands();
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Cannot delete brand.");
      closeDeleteModal();
    }
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

  return (
    <div style={{ backgroundColor: "var(--bg-secondary)", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Brand Management
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Manage product brands
            </p>
          </div>

          <button
            onClick={openAddBrand}
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
            + Add Brand
          </button>
        </div>

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
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              Loading...
            </div>
          ) : brands.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              No brands found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="brands-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Name
                  </th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr
                    key={brand.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                  >
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {brand.name}
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        <button onClick={() => openEditBrand(brand)} style={iconBtnStyle} title="Edit">
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => openDeleteModal(brand)}
                          style={{ ...iconBtnStyle, color: "var(--danger)" }}
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
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>

            <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Page {page} of {totalPages}
            </span>

            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-modal-title"
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
                id="brand-modal-title"
                style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}
              >
                {editingBrand ? "Edit Brand" : "Add Brand"}
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
                <p className="error-text" style={{ color: "var(--danger)", marginTop: "0.5rem" }}>
                  {error}
                </p>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
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
                  onClick={handleSave}
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
            aria-labelledby="brand-delete-modal-title"
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
                id="brand-delete-modal-title"
                style={{ textAlign: "center", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}
              >
                Delete Brand?
              </h3>

              <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                Are you sure you want to delete this brand?
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

export default AdminBrandsPage;
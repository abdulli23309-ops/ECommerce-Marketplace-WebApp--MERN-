import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import ConfirmDialog from "../../components/common/ConfirmDialog";
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

const PermissionGroupsPage = () => {
  // state and handlers identical to original
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPermIds, setSelectedPermIds] = useState([]);

  // ConfirmDialog state for delete action
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/permission-groups", {
        params: { page, pageSize: 10, search, sortBy: sort },
      });
      const payload = res.data?.data || res.data;
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        const groupsArray = payload.items || payload;
        setGroups((groupsArray || []).map((g) => ({ ...g, id: g._id })));
        setTotalPages(payload.totalPages || 1);
      } else {
        const groupsArray = Array.isArray(payload) ? payload : [];
        setGroups(groupsArray.map((g) => ({ ...g, id: g._id })));
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to load groups", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, [page, search, sort]);

  const fetchAllPermissions = async () => {
    try {
      const res = await axiosInstance.get("/admin/permissions");
      const perms = res.data?.data || res.data;
      setAllPermissions(perms.map((p) => ({ id: p._id, name: p.name, code: p.code || p.name })));
    } catch (err) { console.error(err); }
  };

  const fetchGroupPermissions = async (groupId) => {
    try {
      const res = await axiosInstance.get(`/admin/permission-groups/${groupId}/permissions`);
      const perms = res.data?.data || res.data || [];
      setSelectedPermIds(perms);
    } catch (err) { setSelectedPermIds([]); }
  };

  const openCreateModal = () => {
    setEditingGroup(null);
    setForm({ name: "", description: "" });
    setSelectedPermIds([]);
    setError(null);
    setModalOpen(true);
    if (allPermissions.length === 0) fetchAllPermissions();
  };

  const openEditModal = async (group) => {
    setEditingGroup(group);
    setForm({ name: group.name, description: group.description || "" });
    setError(null);
    await Promise.all([fetchAllPermissions(), fetchGroupPermissions(group.id)]);
    setModalOpen(true);
  };

  const handleCheckboxChange = (permId) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, permissionIds: selectedPermIds };
      if (editingGroup) {
        await axiosInstance.put(`/admin/permission-groups/${editingGroup.id}`, payload);
      } else {
        await axiosInstance.post("/admin/permission-groups", payload);
      }
      setModalOpen(false);
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed.");
    }
  };

  const handleDeleteClick = (groupId) => setDeleteTarget(groupId);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/admin/permission-groups/${deleteTarget}`);
      fetchGroups();
    } catch (err) {
      toastError(err.response?.data?.message || "Cannot delete group.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredPermissions = allPermissions.filter((perm) =>
    perm.code.startsWith('Seller.')
  );

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const module = "Seller";
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: "var(--bg-secondary)", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Permission Groups</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>Manage seller permission groups</p>
          </div>
          <button onClick={openCreateModal} style={{
            padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none",
            background: "var(--primary)", color: "var(--primary-contrast)", fontWeight: 600, fontSize: "0.9rem",
            cursor: "pointer", transition: "background 0.2s",
          }}
            onMouseEnter={(e) => (e.target.style.background = "var(--primary-hover)")}
            onMouseLeave={(e) => (e.target.style.background = "var(--primary)")}>
            + Add Group
          </button>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "12px", boxShadow: "0 1px 3px var(--shadow)", border: "1px solid var(--border)", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input className="form-input" placeholder="Search groups..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }} />
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }}>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
          </select>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "12px", boxShadow: "0 1px 3px var(--shadow)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Loading...</div>
          ) : groups.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No groups found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{group.name}</td>
                    <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>{group.description || "—"}</td>
                    <td style={{ padding: "0.75rem 1.25rem", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        <button onClick={() => openEditModal(group)} style={iconBtnStyle} title="Edit"><EditIcon /></button>
                        <button onClick={() => handleDeleteClick(group.id)} style={{ ...iconBtnStyle, color: "var(--danger)" }} title="Delete"><DeleteIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Page {page} of {totalPages}</span>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}

        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "700px", maxHeight: "80vh", overflowY: "auto" }}>
              <h3>{editingGroup ? "Edit Group" : "Create Group"}</h3>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <h4 style={{ marginTop: "1rem", fontWeight: 600 }}>Seller Permissions</h4>
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <div key={module} style={{ marginBottom: "1rem" }}>
                  {perms.map((perm) => (
                    <label key={perm.id} style={{ display: "block", marginLeft: "1rem", fontSize: "0.9rem", cursor: "pointer", color: "var(--text-primary)" }}>
                      <input type="checkbox" checked={selectedPermIds.includes(perm.id)} onChange={() => handleCheckboxChange(perm.id)} style={{ marginRight: "0.5rem" }} />
                      {perm.name}{" "}
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>({perm.code})</span>
                    </label>
                  ))}
                </div>
              ))}

              {error && <p className="error-text">{error}</p>}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button className="btn-primary" onClick={handleSave}>Save</button>
                <button className="btn-edit-profile" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this group?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default PermissionGroupsPage;
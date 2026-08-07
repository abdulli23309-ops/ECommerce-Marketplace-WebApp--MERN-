import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";

const getPermissionRole = (code) => {
  if (!code) return { label: "Unknown", color: "#6b7280", bg: "#f3f4f6" };
  if (code.startsWith("Seller."))
    return { label: "Seller", color: "#065f46", bg: "#ecfdf5" };
  if (
    code.startsWith("Products.") ||
    code.startsWith("Orders.") ||
    code.startsWith("Customers.") ||
    code.startsWith("Reports.")
  )
    return { label: "Customer", color: "#1e40af", bg: "#eff6ff" };
  return { label: "Admin", color: "#991b1b", bg: "#fef2f2" };
};

const PermissionGroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPermIds, setSelectedPermIds] = useState([]);

  // Only ONE fetchGroups declaration — remove the duplicate
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

  useEffect(() => {
    fetchGroups();
  }, [page, search, sort]);

  const fetchAllPermissions = async () => {
    try {
      const res = await axiosInstance.get("/admin/permissions");
      const perms = res.data?.data || res.data;
      setAllPermissions(
        perms.map((p) => ({ id: p._id, name: p.name, code: p.code || p.name }))
      );
    } catch (err) {
      console.error("Failed to load permissions", err);
    }
  };

  const fetchGroupPermissions = async (groupId) => {
    try {
      const res = await axiosInstance.get(
        `/admin/permission-groups/${groupId}/permissions`
      );
      const perms = res.data?.data || res.data || [];
      setSelectedPermIds(perms);
    } catch (err) {
      setSelectedPermIds([]);
    }
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
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, permissionIds: selectedPermIds };
      if (editingGroup) {
        await axiosInstance.put(
          `/admin/permission-groups/${editingGroup.id}`,
          payload
        );
      } else {
        await axiosInstance.post("/admin/permission-groups", payload);
      }
      setModalOpen(false);
      fetchGroups();
    } catch (err) {
      const msg = err.response?.data?.message || "Save failed.";
      setError(msg);
    }
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm("Delete this group?")) return;
    try {
      await axiosInstance.delete(`/admin/permission-groups/${groupId}`);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete group.");
    }
  };

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const module = (perm.code || perm.name).split(".")[0] || "Other";
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {});

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 className="section-title">Permission Groups</h2>
        <button className="add-product-btn" onClick={openCreateModal}>
          + Add Group
        </button>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <input
          className="form-input"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: "250px" }}
        />
        <select
          className="form-input"
          style={{ width: "auto" }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: "#666" }}>Loading...</p>
      ) : groups.length === 0 ? (
        <div className="empty-state">No groups found.</div>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id}>
                <td>{group.name}</td>
                <td>{group.description || "—"}</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => openEditModal(group)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(group.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "700px", maxHeight: "80vh", overflowY: "auto" }}
          >
            <h3>{editingGroup ? "Edit Group" : "Create Group"}</h3>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea
                className="form-input"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <h4 style={{ marginTop: "1rem", fontWeight: 600 }}>Permissions</h4>
            {Object.entries(groupedPermissions).map(([module, perms]) => (
              <div key={module} style={{ marginBottom: "1rem" }}>
                <p
                  style={{
                    fontWeight: 600,
                    color: "#000",
                    marginBottom: "0.25rem",
                  }}
                >
                  {module.charAt(0).toUpperCase() + module.slice(1)}
                </p>
                {perms.map((perm) => {
                  const role = getPermissionRole(perm.code);
                  return (
                    <label
                      key={perm.id}
                      style={{
                        display: "block",
                        marginLeft: "1rem",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermIds.includes(perm.id)}
                        onChange={() => handleCheckboxChange(perm.id)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      {perm.name}{" "}
                      <span
                        style={{
                          color: role.color,
                          background: role.bg,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "4px",
                          marginLeft: "0.25rem",
                          textTransform: "uppercase",
                        }}
                      >
                        {role.label}
                      </span>
                      <span style={{ color: "#888", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                        ({perm.code})
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}

            {error && <p className="error-text">{error}</p>}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button className="btn-primary" onClick={handleSave}>
                Save
              </button>
              <button
                className="btn-edit-profile"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionGroupsPage;
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getAdminUsers } from "../../services/adminService";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";

const statusBadgeStyle = (active) => ({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 600,
  backgroundColor: active ? "var(--success-bg)" : "var(--danger-bg)",
  color: active ? "var(--success-text)" : "var(--danger-text)",
});

const iconBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "4px",
  color: "var(--text-secondary)",
  transition: "background 0.15s, color 0.15s",
};

const ToggleIcon = ({ active }) => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {active ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    )}
  </svg>
);

const AdminUsersPage = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ page, pageSize: 10, search, role: roleFilter, isActive: activeFilter });
      setUsers(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter, activeFilter]);

  const handleToggleActive = async (userId, currentlyActive) => {
    const endpoint = currentlyActive ? "deactivate" : "activate";
    await axiosInstance.put(`/admin/users/${userId}/${endpoint}`);
    fetchUsers();
    setModalOpen(false);
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const isSelf = (userId) => currentUser?.id === userId;

  return (
    <div style={{ backgroundColor: "var(--bg-secondary)", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>User Management</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>Manage user accounts and permissions</p>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "12px", boxShadow: "0 1px 3px var(--shadow)", border: "1px solid var(--border)", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid var(--input-border)",
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              outline: "none"
            }}
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid var(--input-border)",
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              outline: "none"
            }}
          >
            <option value="">All Roles</option>
            <option value="Customer">Customer</option>
            <option value="Seller">Seller</option>
            <option value="Admin">Admin</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid var(--input-border)",
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              outline: "none"
            }}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "12px", boxShadow: "0 1px 3px var(--shadow)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Loading...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No users found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Name</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Email</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Role</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const self = isSelf(user._id);
                  return (
                    <tr
                      key={user._id}
                      style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.15s" }}
                      onClick={() => openModal(user)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                    >
                      <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", fontWeight: 500, color: "var(--text-primary)" }}>{user.name}</td>
                      <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>{user.email}</td>
                      <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>{user.role}</td>
                      <td style={{ padding: "0.75rem 1.25rem" }}>
                        <span style={statusBadgeStyle(user.isActive)}>{user.isActive ? "Active" : "Inactive"}</span>
                      </td>
                      <td style={{ padding: "0.75rem 1.25rem", textAlign: "center" }}>
                        {!self && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(user._id, user.isActive); }}
                            style={{ ...iconBtnStyle, color: user.isActive ? "var(--danger)" : "var(--success)" }}
                            title={user.isActive ? "Deactivate" : "Activate"}
                          >
                            <ToggleIcon active={user.isActive} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

        {modalOpen && selectedUser && (
          <div
            className="modal-overlay"
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setModalOpen(false)}
          >
            <div
              className="modal-content"
              style={{ background: "var(--surface)", borderRadius: "12px", padding: "2rem", maxWidth: "450px", width: "90%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>User Details</h3>
                <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-secondary)" }}>×</button>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                {selectedUser.avatar ? (
                  <img src={getImageUrl(selectedUser.avatar)} alt={selectedUser.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-contrast)", fontSize: "2rem", fontWeight: 700 }}>
                    {selectedUser.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </div>

              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Status:</strong> <span style={statusBadgeStyle(selectedUser.isActive)}>{selectedUser.isActive ? "Active" : "Inactive"}</span></p>

              {!isSelf(selectedUser._id) && (
                <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
                  <button
                    onClick={() => handleToggleActive(selectedUser._id, selectedUser.isActive)}
                    style={{
                      padding: "0.5rem 1.25rem",
                      borderRadius: "6px",
                      border: "none",
                      background: selectedUser.isActive ? "var(--danger)" : "var(--success)",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {selectedUser.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
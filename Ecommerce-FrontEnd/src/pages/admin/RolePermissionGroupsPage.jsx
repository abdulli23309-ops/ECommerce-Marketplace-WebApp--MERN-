import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";

const RolePermissionGroupsPage = () => {
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Frontend-only pagination for Assigned Groups list
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(assignments.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAssignments = assignments.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, groupsRes] = await Promise.all([
          axiosInstance.get("/admin/roles"),
          axiosInstance.get("/admin/permission-groups?pageSize=100"),
        ]);
        const rolesData = rolesRes.data?.data?.items || rolesRes.data?.data || [];
        const groupsData = groupsRes.data?.data?.items || groupsRes.data?.data || [];
        setRoles(rolesData.map(r => ({ id: r._id, name: r.name })));
        setGroups(groupsData.map(g => ({ id: g._id, name: g.name })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Keep current page valid after assignments change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [assignments.length, currentPage, totalPages]);

  const fetchAssignments = async (roleId) => {
    if (!roleId) { setAssignments([]); return; }
    try {
      const res = await axiosInstance.get(`/admin/roles/${roleId}`);
      const role = res.data?.data;
      const permGroups = role?.permissionGroups || [];
      setAssignments(permGroups.map(g => typeof g === 'object' ? g._id : g));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = (e) => {
    const id = e.target.value;
    setSelectedRoleId(id);
    setCurrentPage(1); // reset to first page
    fetchAssignments(id);
  };

  const handleAssign = async () => {
    if (!selectedRoleId || !selectedGroupId) return;
    try {
      await axiosInstance.put(`/admin/roles/${selectedRoleId}/groups/${selectedGroupId}`);
      fetchAssignments(selectedRoleId);
      setSelectedGroupId("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (groupId) => {
    if (!selectedRoleId) return;
    try {
      await axiosInstance.delete(`/admin/roles/${selectedRoleId}/groups/${groupId}`);
      fetchAssignments(selectedRoleId);
    } catch (err) {
      console.error(err);
    }
  };

  const getGroupName = (groupId) => groups.find(g => g.id === groupId)?.name || groupId;

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: "var(--bg-secondary)", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Role Permission Groups</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>Assign permission groups to user roles</p>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "12px", boxShadow: "0 1px 3px var(--shadow)", border: "1px solid var(--border)", padding: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "2rem" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Role</label>
              <select value={selectedRoleId} onChange={handleRoleChange}
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }}
              >
                <option value="">Select a role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Permission Group</label>
              <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }}
              >
                <option value="">Select a group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <button onClick={handleAssign}
              style={{
                padding: "0.5rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--primary)",
                color: "var(--primary-contrast)",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.target.style.background = "var(--primary-hover)")}
              onMouseLeave={(e) => (e.target.style.background = "var(--primary)")}
            >
              Assign Group
            </button>
          </div>

          {selectedRoleId && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>Assigned Groups</h3>
              {assignments.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No groups assigned to this role yet.</p>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {currentAssignments.map(groupId => (
                      <div key={groupId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                        <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{getGroupName(groupId)}</span>
                        <button onClick={() => handleRemove(groupId)} style={{ ...iconBtnStyle, color: "var(--danger)" }} title="Remove">
                          <DeleteIcon />
                        </button>
                      </div>
                    ))}
                  </div>

                  {assignments.length > itemsPerPage && (
                    <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
                      <button
                        className="page-btn"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      >
                        Previous
                      </button>
                      <span style={{ alignSelf: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        className="page-btn"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DeleteIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const iconBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "4px",
  transition: "background 0.15s",
};

export default RolePermissionGroupsPage;
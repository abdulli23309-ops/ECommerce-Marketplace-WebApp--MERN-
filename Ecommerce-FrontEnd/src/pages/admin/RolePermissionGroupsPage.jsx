import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";

const RolePermissionGroupsPage = () => {
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={{ padding: "2rem", color: "#6b7280" }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>Role Permission Groups</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>Assign permission groups to user roles</p>
        </div>

        {/* Configuration Card */}
        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
          {/* Assignment form */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "2rem" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>Role</label>
              <select value={selectedRoleId} onChange={handleRoleChange}
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none", background: "#fff" }}
              >
                <option value="">Select a role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>Permission Group</label>
              <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none", background: "#fff" }}
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
                background: "#111827",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => e.target.style.background = "#1f2937"}
              onMouseLeave={(e) => e.target.style.background = "#111827"}
            >
              Assign Group
            </button>
          </div>

          {/* Assigned groups list */}
          {selectedRoleId && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem" }}>Assigned Groups</h3>
              {assignments.length === 0 ? (
                <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>No groups assigned to this role yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {assignments.map(groupId => (
                    <div key={groupId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #e5e7eb", background: "#f9fafb" }}>
                      <span style={{ fontWeight: 500 }}>{getGroupName(groupId)}</span>
                      <button onClick={() => handleRemove(groupId)} style={{ ...iconBtnStyle, color: "#dc2626" }} title="Remove">
                        <DeleteIcon />
                      </button>
                    </div>
                  ))}
                </div>
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
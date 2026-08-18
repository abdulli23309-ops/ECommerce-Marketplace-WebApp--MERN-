import { useState, useEffect } from "react";
import { fetchAuditLogs } from "../../services/adminAuditLogService";
import Pagination from "../../components/common/Pagination";

const AdminAuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchAuditLogs({ page, pageSize: 50 });
        setLogs(res.items || []);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Admin Audit Log</h1>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading audit logs...</p>
      ) : logs.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No audit logs found.</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            >
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th style={thStyle}>Actor</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>Entity Type</th>
                  <th style={thStyle}>Entity ID</th>
                  <th style={thStyle}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={tdStyle}>{log.actor?.name || log.actor?.email || "Unknown"}</td>
                    <td style={tdStyle}>{log.action}</td>
                    <td style={tdStyle}>{log.entityType}</td>
                    <td style={tdStyle}>{log.entityId?.slice(0, 8)}</td>
                    <td style={tdStyle}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  fontWeight: 600,
  borderBottom: "1px solid var(--border)",
  color: "var(--text-primary)",
};

const tdStyle = {
  padding: "12px 16px",
  color: "var(--text-secondary)",
};

export default AdminAuditLogPage;
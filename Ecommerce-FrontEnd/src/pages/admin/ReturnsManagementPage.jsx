import { useState, useEffect } from "react";
import { getReturns } from "../../services/adminService";
import { getImageUrl } from "../../utils/imageHelper";
import axiosInstance from "../../services/axiosInstance";
import { getStatusBadgeStyle } from "../../utils/statusBadge";

const getStatusLabel = (status) => {
  const labels = {
    PENDING_ADMIN_REVIEW: "Under Admin Review",
    REJECTED_BY_ADMIN: "Request Rejected",
    PENDING_SELLER_REVIEW: "Awaiting Seller Review",
    APPROVED_PENDING_SHIPMENT: "Approved – Awaiting Shipment",
    REJECTED_BY_SELLER: "Declined by Seller",
    ITEM_IN_TRANSIT: "In Transit to Seller",
    SELLER_RECEIVED: "Received by Seller",
    INSPECTED_AND_REFUNDED: "Refund Completed",
  };
  return labels[status] || status;
};

const ReturnsManagementPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedReturn, setSelectedReturn] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await getReturns({ page, pageSize: 10 });

      const items = res.items || (Array.isArray(res) ? res : []);

      setReturns(items);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, [page]);

  const handleAction = async (returnId, action) => {
    try {
      await axiosInstance.put(`/returns/${returnId}/admin-decision`, {
        decision: action === "approve" ? "APPROVE" : "REJECT",
      });

      setReturns((prev) =>
        prev.map((r) =>
          r._id === returnId
            ? {
                ...r,
                status:
                  action === "approve"
                    ? "PENDING_SELLER_REVIEW"
                    : "REJECTED_BY_ADMIN",
              }
            : r
        )
      );
      setModalOpen(false);
    } catch (err) {
      console.error(`Failed to ${action} return`, err);
    }
  };

  const openModal = (ret) => {
    setSelectedReturn(ret);
    setModalOpen(true);
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
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Returns Management
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Review and process customer returns
          </p>
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
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              Loading returns...
            </div>
          ) : returns.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              No return requests.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                    }}
                  >
                    Customer
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Product
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Reason
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Tracking
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1.25rem",
                      textAlign: "center",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {returns.map((ret) => (
                  <tr
                    key={ret._id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s",
                      cursor: "pointer",
                    }}
                    onClick={() => openModal(ret)}
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
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {ret.customer?.email || "—"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1.25rem",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                      }}
                    >
                      {ret.product?.name}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1.25rem",
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ret.reason}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1.25rem",
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {ret.returnTrackingNumber || "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1.25rem" }}>
                      <span style={getStatusBadgeStyle(ret.status)}>
                        {getStatusLabel(ret.status)}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1.25rem",
                        textAlign: "center",
                      }}
                    >
                      {ret.status === "PENDING_ADMIN_REVIEW" && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(ret._id, "approve");
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--success)",
                              cursor: "pointer",
                            }}
                            title="Approve"
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(ret._id, "reject");
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--danger)",
                              cursor: "pointer",
                            }}
                            title="Reject"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                      {ret.status !== "PENDING_ADMIN_REVIEW" && (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {returns.length > 0 && totalPages > 1 && (
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
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
              Page {page} of {totalPages}
            </span>
            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}

        {/* Return Detail Modal */}
        {modalOpen && selectedReturn && (
          <div
            className="modal-overlay"
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
                color: "var(--text-primary)",
                borderRadius: "12px",
                padding: "2rem",
                maxWidth: "600px",
                width: "90%",
                maxHeight: "80vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Return Request
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{ marginBottom: "1rem", color: "var(--text-primary)" }}
              >
                <p>
                  <strong>Customer:</strong>{" "}
                  {selectedReturn.customer?.email}
                </p>
                <p>
                  <strong>Product:</strong> {selectedReturn.product?.name}
                </p>
                <p>
                  <strong>Reason:</strong> {selectedReturn.reason}
                </p>
                {selectedReturn.description && (
                  <p>
                    <strong>Description:</strong>{" "}
                    {selectedReturn.description}
                  </p>
                )}
                {selectedReturn.returnTrackingNumber && (
                  <p>
                    <strong>Tracking:</strong>{" "}
                    {selectedReturn.returnTrackingNumber}
                  </p>
                )}
              </div>

              {selectedReturn.images?.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    marginBottom: "1rem",
                  }}
                >
                  {selectedReturn.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(img)}
                      alt={`Return ${idx}`}
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                      }}
                    />
                  ))}
                </div>
              )}

              {selectedReturn.status === "PENDING_ADMIN_REVIEW" && (
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() =>
                      handleAction(selectedReturn._id, "approve")
                    }
                    style={{
                      padding: "0.5rem 1.25rem",
                      borderRadius: "6px",
                      border: "none",
                      background: "var(--success)",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleAction(selectedReturn._id, "reject")
                    }
                    style={{
                      padding: "0.5rem 1.25rem",
                      borderRadius: "6px",
                      border: "none",
                      background: "var(--danger)",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Reject
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

export default ReturnsManagementPage;
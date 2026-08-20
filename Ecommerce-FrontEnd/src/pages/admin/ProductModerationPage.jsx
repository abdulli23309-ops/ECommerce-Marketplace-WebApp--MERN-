import { useState, useEffect } from "react";
import {
  getProducts,
  getProductStats,
  updateProductStatus,
  warnProduct,
} from "../../services/adminProductService";
import ProductInspectionModal from "./ProductInspectionModal";
import { getImageUrl } from "../../utils/imageHelper";
import { getStatusBadgeStyle } from "../../utils/statusBadge";
import Pagination from "../../components/common/Pagination";
import {
  PRODUCT_LOW_RATING_THRESHOLD,
  LOW_STOCK_THRESHOLD,
  MAX_WARNINGS,
} from "../../utils/warningThresholds";

const WARNING_REASONS = [
  "Misleading Product Information",
  "Low Rating ",
  "Counterfeit/Fake Item",
];

const isWarningState = (product) => {
  const rating = product.avgRating ?? product.averageRating ?? 0;
  const lowStock = Number(product.stock) <= LOW_STOCK_THRESHOLD;
  const lowRating =
    Number(rating) > 0 && Number(rating) < PRODUCT_LOW_RATING_THRESHOLD;

  return lowStock || lowRating;
};

const ProductModerationPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [globalStats, setGlobalStats] = useState({
    pendingApproval: 0,
    highRiskFlags: 0,
    approvedToday: 0,
    rejectionRate: "0%",
  });

  // Custom warning modal state
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningProduct, setWarningProduct] = useState(null);
  const [warningReasonType, setWarningReasonType] = useState("");
  const [customWarningReason, setCustomWarningReason] = useState("");
  const [warningLoading, setWarningLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts({ page, pageSize });
      setProducts(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load products", err);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const stats = await getProductStats();
      setGlobalStats(stats);
    } catch (err) {
      console.error("Failed to load product statistics", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const handleStatusChange = async (productId, newStatus, reason, note) => {
    try {
      await updateProductStatus(productId, newStatus, reason, note);

      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? {
                ...p,
                status: newStatus,
                rejectionReason: reason,
                internalNote: note,
              }
            : p
        )
      );

      fetchGlobalStats();
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  const openWarningModal = (product) => {
    setWarningProduct(product);
    setWarningReasonType("");
    setCustomWarningReason("");
    setWarningModalOpen(true);
  };

  const closeWarningModal = () => {
    setWarningModalOpen(false);
    setWarningProduct(null);
    setWarningReasonType("");
    setCustomWarningReason("");
    setWarningLoading(false);
  };

  const handleConfirmWarning = async () => {
    if (!warningProduct) return;

    const finalReason =
      warningReasonType === "Other"
        ? customWarningReason.trim()
        : warningReasonType;

    if (!finalReason) {
      alert("Please select or enter a warning reason.");
      return;
    }

    setWarningLoading(true);

    try {
      await warnProduct(warningProduct._id, finalReason);
      await fetchProducts();
      await fetchGlobalStats();
      closeWarningModal();
    } catch (err) {
      console.error("Failed to warn product", err);
      alert(err.response?.data?.message || "Could not issue warning.");
    } finally {
      setWarningLoading(false);
    }
  };

  const getRiskBadge = (product) => {
    const rating = product.avgRating ?? product.averageRating ?? 0;

    if (product.status === "Suspended" || product.status === "Rejected") {
      return (
        <span
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger-text)",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          {product.status}
        </span>
      );
    }

    if (Number(rating) > 0 && Number(rating) < PRODUCT_LOW_RATING_THRESHOLD) {
      return (
        <span
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger-text)",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          Low Rating {Number(rating).toFixed(1)}
        </span>
      );
    }

    if (Number(product.stock) <= LOW_STOCK_THRESHOLD) {
      return (
        <span
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger-text)",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          Low Stock
        </span>
      );
    }

    return (
      <span
        style={{
          background: "var(--success-bg)",
          color: "var(--success-text)",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "0.75rem",
          fontWeight: 600,
        }}
      >
        Clean
      </span>
    );
  };

  if (loading && page === 1) {
    return (
      <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>
        Loading moderation queue...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "var(--text-primary)",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: "1.5rem",
          letterSpacing: "-0.025em",
        }}
      >
        PRODUCT MODERATION
      </h1>

      {/* Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          {
            label: "PENDING APPROVAL",
            count: globalStats.pendingApproval ?? 0,
            accent: "var(--warning)",
          },
          {
            label: "HIGH RISK FLAGS",
            count: globalStats.highRiskFlags ?? 0,
            accent: "var(--danger)",
          },
          {
            label: "APPROVED TODAY",
            count: globalStats.approvedToday ?? 0,
            accent: "var(--success)",
          },
          {
            label: "REJECTION RATE",
            count: globalStats.rejectionRate ?? "0%",
            accent: "var(--text-secondary)",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: card.accent,
                letterSpacing: "0.05em",
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {card.count}
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          overflow: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.875rem",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-secondary)",
              }}
            >
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Store / Seller</th>
              <th style={thStyle}>Price & Stock</th>
              <th style={thStyle}>Risk</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                  }}
                >
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isWarning = isWarningState(product);
                const warningCount = product.warningCount || 0;
                const canWarn =
                  isWarning && product.status !== "Suspended" && warningCount < MAX_WARNINGS;

                return (
                  <tr
                    key={product._id}
                    className={isWarning ? "warning-flag-red" : ""}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td style={tdStyle}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={getImageUrl(product.images?.[0]) || "/placeholder.png"}
                          alt={product.name}
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "4px",
                            objectFit: "cover",
                            border: "1px solid var(--border)",
                          }}
                          onError={(e) => (e.target.style.display = "none")}
                        />
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {product.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            ID: {product._id.slice(-8)}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {product.category?.name}
                            {product.subCategory?.name &&
                              ` > ${product.subCategory.name}`}
                          </div>
                          {isWarning && (
                            <span
                              className="warning-badge-text"
                              style={{
                                display: "inline-block",
                                marginTop: "4px",
                                background: "var(--danger-bg)",
                                color: "var(--danger-text)",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "0.65rem",
                                fontWeight: 600,
                              }}
                            >
                              {Number(product.stock) <= LOW_STOCK_THRESHOLD
                                ? "Low Stock"
                                : "Low Rating"}{" "}
                              {warningCount > 0 && `· ${warningCount}/${MAX_WARNINGS}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {product.store?.logo ? (
                          <img
                            src={getImageUrl(product.store.logo)}
                            alt={product.store.name}
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ) : (
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: "var(--border)",
                            }}
                          />
                        )}
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {product.store?.name || "Unknown Store"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Store ID: {product.store?._id?.slice(-6) || "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        PKR {product.price?.toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Stock: {product.stock}
                      </div>
                    </td>

                    <td style={tdStyle}>{getRiskBadge(product)}</td>

                    <td style={tdStyle}>
                      <span style={getStatusBadgeStyle(product.status)}>
                        {product.status}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() => setSelectedProduct(product)}
                          style={primaryActionStyle}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--primary-hover)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "var(--primary)")
                          }
                        >
                          Inspect & Decide
                        </button>

                        {canWarn && (
                          <button
                            onClick={() => openWarningModal(product)}
                            style={{
                              background: "var(--danger)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "0.5rem 1rem",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            Warn {warningCount + 1}/{MAX_WARNINGS}
                          </button>
                        )}

                        {isWarning && warningCount >= MAX_WARNINGS && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "var(--danger-text)",
                              alignSelf: "center",
                            }}
                          >
                            Final warning limit reached
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Product Inspection Modal */}
      {selectedProduct && (
        <ProductInspectionModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Custom Warning Reason Modal */}
      {warningModalOpen && warningProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={closeWarningModal}
        >
          <div
            style={{
              background: "var(--surface)",
              color: "var(--text-primary)",
              borderRadius: "16px",
              padding: "2rem",
              width: "90%",
              maxWidth: "520px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                }}
              >
                Issue Product Warning
              </h3>
              <button
                onClick={closeWarningModal}
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

            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                Product:{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {warningProduct.name}
                </strong>
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Warning Reason</label>
              <select
                className="form-input"
                value={warningReasonType}
                onChange={(e) => setWarningReasonType(e.target.value)}
              >
                <option value="">Select reason...</option>
                {WARNING_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            {warningReasonType === "Other" && (
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Custom Reason</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={customWarningReason}
                  onChange={(e) => setCustomWarningReason(e.target.value)}
                  placeholder="Enter custom warning reason..."
                />
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                marginTop: "1.75rem",
              }}
            >
              <button
                className="btn-edit-profile"
                onClick={closeWarningModal}
                disabled={warningLoading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmWarning}
                disabled={
                  warningLoading ||
                  !warningReasonType ||
                  (warningReasonType === "Other" && !customWarningReason.trim())
                }
                style={{ width: "auto", marginTop: 0 }}
              >
                {warningLoading ? "Issuing..." : "Confirm Warning"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: "0.75rem 1rem",
  textAlign: "left",
  fontWeight: 600,
  color: "var(--text-secondary)",
};

const tdStyle = {
  padding: "0.75rem 1rem",
  verticalAlign: "middle",
};

const primaryActionStyle = {
  background: "var(--primary)",
  color: "var(--primary-contrast)",
  border: "none",
  borderRadius: "6px",
  padding: "0.5rem 1rem",
  fontWeight: 600,
  fontSize: "0.8rem",
  cursor: "pointer",
  transition: "background 0.2s",
};

export default ProductModerationPage;
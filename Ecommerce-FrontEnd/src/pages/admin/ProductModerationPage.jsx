import { useState, useEffect } from "react";
import { getProducts, getProductStats, updateProductStatus } from "../../services/adminProductService";
import ProductInspectionModal from "./ProductInspectionModal";
import { getImageUrl } from "../../utils/imageHelper";
import { getStatusBadgeStyle } from "../../utils/statusBadge";
import Pagination from "../../components/common/Pagination";

const ProductModerationPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Backend pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Global metrics state
  const [globalStats, setGlobalStats] = useState({
    pendingApproval: 0,
    highRiskFlags: 0,
    approvedToday: 0,
    rejectionRate: "0%",
  });

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

  const getRiskBadge = (product) => {
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
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Product
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Store / Seller
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Price & Stock
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Risk
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Actions
              </th>
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
              products.map((product) => (
                <tr
                  key={product._id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "center",
                      }}
                    >
                      <img
                        src={
                          getImageUrl(product.images?.[0]) ||
                          "/placeholder.png"
                        }
                        alt={product.name}
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "4px",
                          objectFit: "cover",
                          border: "1px solid var(--border)",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
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
                      </div>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      verticalAlign: "middle",
                    }}
                  >
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
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
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

                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      verticalAlign: "middle",
                    }}
                  >
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

                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      verticalAlign: "middle",
                    }}
                  >
                    {getRiskBadge(product)}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      verticalAlign: "middle",
                    }}
                  >
                    <span style={getStatusBadgeStyle(product.status)}>
                      {product.status}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      verticalAlign: "middle",
                    }}
                  >
                    <button
                      onClick={() => setSelectedProduct(product)}
                      style={{
                        background: "var(--primary)",
                        color: "var(--primary-contrast)",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.5rem 1rem",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Inspection Drawer */}
      {selectedProduct && (
        <ProductInspectionModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default ProductModerationPage;
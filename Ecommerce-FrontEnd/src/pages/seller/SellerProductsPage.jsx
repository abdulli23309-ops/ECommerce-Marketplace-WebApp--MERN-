import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../../utils/imageHelper";
import { fetchSellerProducts, deleteProduct } from "../../services/sellerProductService";
import PermissionGate from "../../components/common/PermissionGate";
import { getStatusBadgeStyle } from "../../utils/statusBadge";

// --- Helper: warning state (stock ≤ 5 or avg rating < 2.0) ---
const isWarningState = (product) => {
  const lowStock = Number(product.stock) <= 5;
  const lowRating =
    product.averageRating > 0 && Number(product.averageRating) < 2.0;
  return lowStock || lowRating;
};

const SellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetchSellerProducts({ page, pageSize: 12 });
      setProducts(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page]);

  const handleDelete = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(productId);
      loadProducts();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading...</div>;

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className="section-title" style={{ margin: 0 }}>Your Products</h2>
        <PermissionGate permission="Seller.Products.Create">
          <Link to="/seller/products/new" className="add-product-btn">+ Add Product</Link>
        </PermissionGate>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">You haven't added any products yet.</div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>Product</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>Price</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>Stock</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>Rating</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>Reviews</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isWarning = isWarningState(product);
                return (
                  <tr
                    key={product._id}
                    className={isWarning ? "warning-flag-red" : ""}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
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
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{product.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            ID: {product._id.slice(-8)}
                          </div>
                          {isWarning && (
                            <span className="warning-badge-text" style={{
                              display: "inline-block",
                              marginTop: "4px",
                              background: "var(--danger-bg)",
                              color: "var(--danger-text)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.65rem",
                              fontWeight: 600,
                            }}>
                              {product.stock <= 5 ? "Low Stock" : "Low Rating"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle", fontWeight: 600, color: "var(--text-primary)" }}>
                      PKR {product.price?.toLocaleString()}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle", color: "var(--text-primary)" }}>
                      {product.stockQuantity ?? product.stock ?? 0}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle" }}>
                      <span style={getStatusBadgeStyle(product.status)}>{product.status}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle", color: product.avgRating > 0 ? "var(--warning)" : "var(--text-muted)" }}>
                      {product.avgRating > 0 ? `${product.avgRating} ★` : "No rating"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle", color: "var(--text-secondary)" }}>
                      {product.reviewCount || 0}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle" }}>
                      <PermissionGate permission="Seller.Products.Edit">
                        <Link
                          to={`/seller/products/edit/${product._id}`}
                          className="btn-edit"
                          style={{ marginRight: "0.5rem" }}
                        >
                          Edit
                        </Link>
                      </PermissionGate>
                      <PermissionGate permission="Seller.Products.Delete">
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </PermissionGate>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span style={{ color: "var(--text-secondary)" }}>
            Page {page} of {totalPages}
          </span>
          <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;
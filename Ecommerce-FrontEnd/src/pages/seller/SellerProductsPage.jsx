import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../../utils/imageHelper";
import { fetchSellerProducts, deleteProduct } from "../../services/sellerProductService";
import PermissionGate from "../../components/common/PermissionGate";

const statusBadgeStyle = (status) => {
  const base = {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    display: "inline-block",
    textAlign: "center",
    minWidth: "100px",
  };
  switch (status) {
    case "Approved":
      return { ...base, background: "#dcfce7", color: "#166534" };
    case "PendingApproval":
      return { ...base, background: "#fef9c3", color: "#854d0e" };
    case "Suspended":
    case "Rejected":
      return { ...base, background: "#fee2e2", color: "#991b1b" };
    default:
      return { ...base, background: "#f3f4f6", color: "#1f2937" };
  }
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

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading...</div>;

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className="section-title" style={{ margin: 0 }}>Your Products</h2>
        <PermissionGate permission="Seller.Products.Create">
          <Link to="/seller/products/new" className="add-product-btn">+ Add Product</Link>
        </PermissionGate>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">You haven't added any products yet.</div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Product</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Price</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Stock</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Rating</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Reviews</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#4b5563" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {/* Product image + name */}
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
                          border: "1px solid #e5e7eb",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{product.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                          ID: {product._id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Price */}
                  <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle", fontWeight: 600 }}>
                    PKR {product.price?.toLocaleString()}
                  </td>
                  {/* Stock */}
                  <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle" }}>
                    {product.stockQuantity ?? product.stock ?? 0}
                  </td>
                  {/* Status badge */}
                  <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle" }}>
                    <span style={statusBadgeStyle(product.status)}>{product.status}</span>
                  </td>
                  {/* Rating (placeholder – replace with real data later) */}
                  <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle", color: "#f59e0b" }}>
                    {product.rating ? `${product.rating} ★` : "—"}
                  </td>
                  {/* Reviews count */}
                  <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle", color: "#6b7280" }}>
                    {product.reviews ? product.reviews.length : 0}
                  </td>
                  {/* Actions */}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
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
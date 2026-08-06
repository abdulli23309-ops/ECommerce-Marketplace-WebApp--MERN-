import { useState, useEffect } from "react";
import { getProducts, updateProductStatus } from "../../services/adminService";
import PermissionGate from "../../components/common/PermissionGate";

const ProductModerationPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await updateProductStatus(productId, newStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      console.error("Failed to update product status", err);
    }
  };

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading products...</div>;

  return (
    <div>
      <h2 className="section-title">Product Moderation</h2>

      {products.length === 0 ? (
        <div className="empty-state">No products to review.</div>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Store</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.storeName}</td>
                <td>PKR {product.basePrice?.toLocaleString()}</td>
                <td>{product.stockQuantity}</td>
                <td>
                  <span style={{ fontWeight: 600, color: product.status === "Approved" ? "#000" : "#666" }}>
                    {product.status}
                  </span>
                </td>
                <td>
                  <PermissionGate permission="Products.Approve">
                    <select
                      className="shipment-select"
                      value={product.status}
                      onChange={(e) => {
                        if (e.target.value !== product.status) {
                          handleStatusChange(product.id, e.target.value);
                        }
                      }}
                    >
                      <option value="PendingApproval">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </PermissionGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProductModerationPage;
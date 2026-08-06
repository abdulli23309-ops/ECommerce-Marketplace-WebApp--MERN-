import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../../utils/imageHelper";
import { fetchSellerProducts, deleteProduct } from "../../services/sellerProductService";
import PermissionGate from "../../components/common/PermissionGate";

const SellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchSellerProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>Your Products</h2>

        {/* Only show Add Product if seller has create permission */}
        <PermissionGate permission="Seller.Products.Create">
          <Link to="/seller/products/new" className="add-product-btn">+ Add Product</Link>
        </PermissionGate>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>You haven't added any products yet.</p>
        </div>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "0.25rem" }}
                    />
                  ) : (
                    <div style={{ width: "50px", height: "50px", background: "#f3f4f6", borderRadius: "0.25rem" }} />
                  )}
                </td>
                <td>{product.name}</td>
                <td>PKR {product.basePrice?.toLocaleString()}</td>
                <td>{product.stockQuantity || 0}</td>
                <td>{product.status}</td>
                <td>
                  {/* Edit button only if seller has edit permission */}
                  <PermissionGate permission="Seller.Products.Edit">
                    <Link to={`/seller/products/edit/${product.id}`} className="btn-edit">Edit</Link>
                  </PermissionGate>

                  {/* Delete button only if seller has delete permission */}
                  <PermissionGate permission="Seller.Products.Delete">
                    <button onClick={() => handleDelete(product.id)} className="btn-delete">Delete</button>
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

export default SellerProductsPage;
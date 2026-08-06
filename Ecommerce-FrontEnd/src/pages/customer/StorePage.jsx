import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { fetchApprovedProducts } from "../../services/productService";
import { getImageUrl } from "../../utils/imageHelper";

const StorePage = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch store details (public endpoint)
        const storeRes = await axiosInstance.get(`/stores/${storeId}`);
        setStore(storeRes.data);

        // Fetch products for this store (using existing endpoint)
        const productsRes = await axiosInstance.get(`/products/store/${storeId}`);
        setProducts(productsRes.data || []);
      } catch (err) {
        console.error("Failed to load store page", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storeId]);

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading store...</div>;
  if (!store) return <div style={{ padding: "2rem", color: "#666" }}>Store not found.</div>;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem" }}>
      {/* Store Header */}
      <div className="store-header" style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid #eaeaea" }}>
        {store.logoUrl ? (
          <img
            src={getImageUrl(store.logoUrl)}
            alt={store.name}
            style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "0.5rem", border: "1px solid #eaeaea" }}
          />
        ) : (
          <div style={{ width: "80px", height: "80px", background: "#f5f5f5", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
            No Logo
          </div>
        )}
        <div>
          <h1 className="section-title" style={{ margin: 0 }}>{store.name}</h1>
          {store.description && <p style={{ color: "#666", marginTop: "0.5rem" }}>{store.description}</p>}
        </div>
      </div>

      {/* Products Grid */}
      <h2 className="section-title">Products</h2>
      {products.length === 0 ? (
        <p style={{ color: "#666" }}>This store hasn't listed any products yet.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <Link to={`/products/${product.id}`} key={product.id} className="product-card">
              <div className="product-image">
                {product.images && product.images.length > 0 ? (
                  <img src={getImageUrl(product.images[0])} alt={product.name} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              <div className="product-details">
                <p className="product-name">{product.name}</p>
                <p className="product-price">PKR {product.basePrice?.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default StorePage;
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";

const StorePage = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch store details (public route)
        const storeRes = await axiosInstance.get(`/stores/${storeId}`);
        const storeData = storeRes.data?.data || storeRes.data;
        setStore(storeData);

        // Fetch store's approved products (public products endpoint)
        const productsRes = await axiosInstance.get("/products/public", {
          params: { store: storeId, pageSize: 100 },
        });
        // The response is { products, total, ... } – extract products array
        const allProducts = productsRes.data?.data?.products || productsRes.data?.data || [];
        setProducts(allProducts);
      } catch (err) {
        console.error("Failed to load store page", err);
        setError("Store not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storeId]);

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading store...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;
  if (!store) return <div style={{ padding: "2rem", color: "#666" }}>Store not found.</div>;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem" }}>
      {/* Store Header */}
      <div className="store-header" style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid #eaeaea" }}>
        {store.logo ? (                             // ← use "logo" not "logoUrl"
          <img
            src={getImageUrl(store.logo)}           // ← use "store.logo"
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
            <Link to={`/products/${product._id}`} key={product._id} className="product-card">   {/* ← use "_id", not "id" */}
              <div className="product-image">
                {product.images && product.images.length > 0 ? (
                  <img src={getImageUrl(product.images[0])} alt={product.name} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              <div className="product-details">
                <p className="product-name">{product.name}</p>
                <p className="product-price">PKR {product.price?.toLocaleString()}</p>   {/* ← "price" not "basePrice" */}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default StorePage;
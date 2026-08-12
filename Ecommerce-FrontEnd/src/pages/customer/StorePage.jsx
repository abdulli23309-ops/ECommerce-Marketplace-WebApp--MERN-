// src/pages/customer/StorePage.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";   // fixed path
import { getImageUrl } from "../../utils/imageHelper";     // fixed path

const StorePage = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        // 1. Fetch store info
        const storeRes = await axiosInstance.get(`/stores/${storeId}`);
        const storeData = storeRes.data?.data || storeRes.data;
        setStore(storeData);

        // 2. Fetch only this store’s products
        const productsRes = await axiosInstance.get(`/products`, {
          params: { store: storeId },
        });
        const productsData =
          productsRes.data?.data?.items ||
          productsRes.data?.items ||
          productsRes.data ||
          [];
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        console.error("Failed to load store or products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [storeId]);

  if (loading)
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading store...</div>;
  if (!store)
    return <div style={{ padding: "2rem", textAlign: "center" }}>Store not found.</div>;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Store Header */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        {store.logo && (
          <img
            src={getImageUrl(store.logo)}
            alt={store.name}
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "12px",
              objectFit: "cover",
              border: "1px solid #e5e7eb",
            }}
          />
        )}
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
            {store.name}
          </h1>
          {store.description && (
            <p style={{ color: "#4b5563", marginTop: "0.5rem" }}>
              {store.description}
            </p>
          )}
          {store.city && (
            <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
              📍 {store.city}
            </p>
          )}
        </div>
      </div>

      {/* Products Section */}
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "2rem 0 1rem" }}>
        Products
      </h2>
      {products.length === 0 ? (
        <p style={{ color: "#6b7280" }}>This store has no products yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {products.map((product) => (
            <div
              key={product._id}
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0,0,0,0.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 1px 3px rgba(0,0,0,0.05)")
              }
            >
              <div
                style={{
                  height: "180px",
                  background: "#f9fafb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {product.images?.[0] ? (
                  <img
                    src={getImageUrl(product.images[0])}
                    alt={product.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                    No image
                  </div>
                )}
              </div>
              <div style={{ padding: "1rem" }}>
                <h3
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    margin: "0 0 0.5rem",
                  }}
                >
                  {product.name}
                </h3>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  PKR {product.price?.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StorePage;
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";

const StorePage = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      try {
        const storeRes = await axiosInstance.get(`/stores/${storeId}`);
        const storeData = storeRes.data?.data || storeRes.data;
        setStore(storeData);

        const productsRes = await axiosInstance.get(`/products`, {
          params: {
            store: storeId,
            page,
            pageSize,
          },
        });

        const payload = productsRes.data?.data || {};
        const items = payload.items || payload.products || [];
        setProducts(Array.isArray(items) ? items : []);
        setTotalPages(payload.totalPages || 1);
      } catch (err) {
        console.error("Failed to load store or products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [storeId, page]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
        Loading store...
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
        Store not found.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Store header unchanged */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "2rem" }}>
        {store.logo && (
          <img
            src={getImageUrl(store.logo)}
            alt={store.name}
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "12px",
              objectFit: "cover",
              border: "1px solid var(--border)",
            }}
          />
        )}
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            {store.name}
          </h1>
          {store.description && (
            <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
              {store.description}
            </p>
          )}
          {store.city && (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              📍 {store.city}
            </p>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "2rem 0 1rem", color: "var(--text-primary)" }}>
        Products
      </h2>

      {products.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>This store has no products yet.</p>
      ) : (
        <>
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
                  background: "var(--surface)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px var(--shadow)",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = "0 4px 12px var(--shadow)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow = "0 1px 3px var(--shadow)")
                }
              >
                <div
                  style={{
                    height: "180px",
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {product.images?.[0] ? (
                    <img
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
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
                      color: "var(--text-primary)",
                    }}
                  >
                    {product.name}
                  </h3>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    PKR {product.price?.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                marginTop: "2rem",
              }}
            >
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StorePage;
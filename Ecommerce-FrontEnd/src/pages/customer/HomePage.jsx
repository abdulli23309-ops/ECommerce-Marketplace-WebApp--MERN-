import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { fetchApprovedProducts, fetchSearchSuggestions } from "../../services/productService";
import { getImageUrl } from "../../utils/imageHelper";
import FreeDeliveryBadge from "../../components/common/FreeDeliveryBadge";
import { GridSkeleton } from "../../components/common/Skeleton";
import EmptyState from "../../components/common/EmptyState";
import { formatPKR } from "../../utils/currency";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState({ products: [], categories: [], brands: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const debounceRef = useRef(null);
  const navigate = useNavigate();
  const recentlyViewed = useSelector((state) => state.recentlyViewed.items);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchApprovedProducts({ page: 1, pageSize: 8 });
        setProducts(data.items || []);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearchInputChange = (value) => {
    const query = value.trim();

    if (query.length < 2) {
      setSuggestions({ products: [], categories: [], brands: [] });
      setShowSuggestions(false);
      setSuggestionLoading(false);
      return;
    }

    setSuggestionLoading(true);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchSearchSuggestions(query);
        setSuggestions(res);
        setShowSuggestions(true);
      } catch {
        setSuggestions({ products: [], categories: [], brands: [] });
        setShowSuggestions(false);
      } finally {
        setSuggestionLoading(false);
      }
    }, 300);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();

    if (trimmed) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const productPath = (product) => `/products/${product._id || product.id}`;

  return (
    <div>
      {/* Hero Banner */}
      <section className="hero-banner">
        <h2 className="hero-title">Elevate Your Essentials.</h2>
        <p className="hero-subtitle">Discover premium products from verified sellers.</p>

        <form className="hero-search" onSubmit={handleSearch} style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search for products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearchInputChange(e.target.value);
            }}
            onFocus={() => {
              if (
                suggestions.products.length ||
                suggestions.categories.length ||
                suggestions.brands.length
              ) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowSuggestions(false);
            }}
          />
          <button type="submit">Search</button>

          {showSuggestions && (
            <div
              className="suggestions-dropdown"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 10,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                boxShadow: "0 4px 12px var(--shadow)",
                maxHeight: "320px",
                overflowY: "auto",
                marginTop: "4px",
              }}
            >
              {suggestionLoading ? (
                <div style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>
                  Loading...
                </div>
              ) : (
                <>
                  {suggestions.products.map((p) => (
                    <Link
                      key={p._id || p.id}
                      to={`/products/${p._id || p.id}`}
                      onClick={() => setShowSuggestions(false)}
                      style={{
                        display: "block",
                        padding: "8px 12px",
                        color: "var(--text-primary)",
                        textDecoration: "none",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {p.name}
                    </Link>
                  ))}

                  {suggestions.categories.map((c) => (
                    <Link
                      key={`cat-${c._id}`}
                      to={`/products?categoryId=${c._id}`}
                      onClick={() => setShowSuggestions(false)}
                      style={{
                        display: "block",
                        padding: "8px 12px",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                      }}
                    >
                      Category: {c.name}
                    </Link>
                  ))}

                  {suggestions.brands.map((b) => (
                    <Link
                      key={`brand-${b._id}`}
                      to={`/products?brandId=${b._id}`}
                      onClick={() => setShowSuggestions(false)}
                      style={{
                        display: "block",
                        padding: "8px 12px",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                      }}
                    >
                      Brand: {b.name}
                    </Link>
                  ))}

                  {suggestions.products.length === 0 &&
                    suggestions.categories.length === 0 &&
                    suggestions.brands.length === 0 && (
                      <div style={{ padding: "8px 12px", color: "var(--text-muted)" }}>
                        No suggestions found
                      </div>
                    )}
                </>
              )}
            </div>
          )}
        </form>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <h3 className="section-title">New Arrivals</h3>

        {loading ? (
          <GridSkeleton count={8} />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products available right now"
            body="Check back soon — sellers are adding new products all the time."
          />
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <Link
                to={productPath(product)}
                key={product._id || product.id}
                className="product-card"
              >
                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    height: "260px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      className="product-image"
                    />
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                      No Image
                    </span>
                  )}
                </div>

                <div className="product-details">
                  <p className="product-name">{product.name}</p>
                  <p className="product-price">PKR {formatPKR(product.price)}</p>

                  {product.freeDelivery === true && (
                    <FreeDeliveryBadge style={{ marginTop: "0.5rem" }} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="featured-section">
          <h3 className="section-title">Recently Viewed</h3>

          <div className="product-grid">
            {recentlyViewed.map((product) => (
              <Link
                to={`/products/${product.id || product._id}`}
                key={product.id || product._id}
                className="product-card"
              >
                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    height: "260px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {product.image ? (
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="product-image"
                    />
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                      No Image
                    </span>
                  )}
                </div>

                <div className="product-details">
                  <p className="product-name">{product.name}</p>
                  <p className="product-price">PKR {formatPKR(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
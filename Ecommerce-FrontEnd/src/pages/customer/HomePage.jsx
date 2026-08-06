import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchApprovedProducts } from "../../services/productService";
import { getImageUrl } from "../../utils/imageHelper";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

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

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) {
      navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div>
      {/* Hero Banner */}
      <section className="hero-banner">
        <h2 className="hero-title">Elevate Your Essentials.</h2>
        <p className="hero-subtitle">Discover premium products from verified sellers.</p>
        <form className="hero-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <h3 className="section-title">New Arrivals</h3>
        
        {loading ? (
          <p style={{ color: '#666' }}>Loading products...</p>
        ) : products.length === 0 ? (
          <p style={{ color: '#666' }}>No products available right now.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <Link
                to={`/products/${product.id}`}
                key={product.id}
                className="product-card"
              >
                <div style={{ backgroundColor: '#f9fafb', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      className="product-image"
                    />
                  ) : (
                    <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>No Image</span>
                  )}
                </div>
                <div className="product-details">
                  <p className="product-name">{product.name}</p>
                  <p className="product-price">PKR {product.basePrice}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
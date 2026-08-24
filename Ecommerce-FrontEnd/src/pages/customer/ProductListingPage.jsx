import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchApprovedProducts, fetchSearchSuggestions } from "../../services/productService";
import { getImageUrl } from "../../utils/imageHelper";
import { fetchCategories, fetchSubCategories } from "../../services/categoryService";
import { fetchBrands } from "../../services/brandService";
import { addItemToWishlist } from "../../store/wishlistSlice";
import Pagination from "../../components/common/Pagination";
import FreeDeliveryBadge from "../../components/common/FreeDeliveryBadge";

const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: searchParams.get("categoryId") || "",
    subCategoryId: searchParams.get("subCategoryId") || "",
    brandId: searchParams.get("brandId") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    search: searchParams.get("search") || "",
    sortBy: searchParams.get("sortBy") || "newest",
  });

  const [suggestions, setSuggestions] = useState({ products: [], categories: [], brands: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
    fetchBrands().then(setBrands).catch(console.error);
  }, []);

  useEffect(() => {
    if (filters.categoryId) {
      fetchSubCategories(filters.categoryId).then(setSubCategories).catch(console.error);
    } else {
      setSubCategories([]);
      setFilters(prev => ({ ...prev, subCategoryId: '' }));
    }
  }, [filters.categoryId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchApprovedProducts({
          page: currentPage,
          pageSize: 12,
          ...filters,
        });
        setProducts(data.items || []);
        setTotalPages(data.totalPages);
        const params = new URLSearchParams();
        if (currentPage > 1) params.set("page", currentPage);
        if (filters.categoryId) params.set("categoryId", filters.categoryId);
        if (filters.subCategoryId) params.set("subCategoryId", filters.subCategoryId);
        if (filters.brandId) params.set("brandId", filters.brandId);
        if (filters.minPrice) params.set("minPrice", filters.minPrice);
        if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
        if (filters.search) params.set("search", filters.search);
        if (filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
        setSearchParams(params, { replace: true });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentPage, filters, setSearchParams]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === "search") {
      handleSearchInputChange(value);
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
      setCurrentPage(1);
    }
  };

  const handleSearchInputChange = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      categoryId: "",
      subCategoryId: "",
      brandId: "",
      minPrice: "",
      maxPrice: "",
      search: "",
      sortBy: "newest",
    });
    setSuggestions({ products: [], categories: [], brands: [] });
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  return (
    <div className="listing-page animate-fade-in">
      <div className="listing-toolbar">
        <form onSubmit={handleSearchSubmit} className="listing-search" style={{ position: "relative" }}>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="🔍 Search products, brands, categories..."
            className="form-input"
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
          <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0.65rem 1.75rem", borderRadius: "99px" }}>
            Search
          </button>

          {showSuggestions && (
            <div className="suggestions-dropdown">
              {suggestionLoading ? (
                <div style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Searching...
                </div>
              ) : (
                <>
                  {suggestions.products.map((p) => (
                    <Link
                      key={p._id}
                      to={`/products/${p._id}`}
                      onClick={() => setShowSuggestions(false)}
                      style={{
                        display: "block",
                        padding: "10px 16px",
                        color: "var(--text-primary)",
                        textDecoration: "none",
                        borderBottom: "1px solid var(--border)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <strong>{p.name}</strong>
                    </Link>
                  ))}
                  {suggestions.categories.map((c) => (
                    <Link
                      key={`cat-${c._id}`}
                      to={`/products?categoryId=${c._id}`}
                      onClick={() => setShowSuggestions(false)}
                      style={{
                        display: "block",
                        padding: "10px 16px",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      📁 Category: {c.name}
                    </Link>
                  ))}
                  {suggestions.brands.map((b) => (
                    <Link
                      key={`brand-${b._id}`}
                      to={`/products?brandId=${b._id}`}
                      onClick={() => setShowSuggestions(false)}
                      style={{
                        display: "block",
                        padding: "10px 16px",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      🏷️ Brand: {b.name}
                    </Link>
                  ))}
                  {suggestions.products.length === 0 &&
                    suggestions.categories.length === 0 &&
                    suggestions.brands.length === 0 && (
                      <div style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        No suggestions found
                      </div>
                    )}
                </>
              )}
            </div>
          )}
        </form>
        <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="form-input" style={{ width: "auto", minWidth: "180px", borderRadius: "8px" }}>
          <option value="newest">🆕 Newest First</option>
          <option value="price_asc">💰 Price: Low to High</option>
          <option value="price_desc">💎 Price: High to Low</option>
        </select>
      </div>

      <div className="listing-content">
        <aside className="listing-filters">
          <h3 className="filter-title">🎛️ Filters</h3>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange} className="form-input">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subcategory</label>
            <select name="subCategoryId" value={filters.subCategoryId} onChange={handleFilterChange} className="form-input" disabled={!filters.categoryId}>
              <option value="">All Subcategories</option>
              {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Brand</label>
            <select name="brandId" value={filters.brandId} onChange={handleFilterChange} className="form-input">
              <option value="">All Brands</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Min Price (PKR)</label>
            <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} className="form-input" placeholder="0" min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Max Price (PKR)</label>
            <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} className="form-input" placeholder="Any" min="0" />
          </div>
          <button className="btn-remove" onClick={resetFilters} style={{ marginTop: "1rem", width: "100%" }}>
            🔄 Clear All Filters
          </button>
        </aside>

        <main className="listing-products">
          {loading ? (
            <div className="skeleton-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton" style={{ height: "260px", marginBottom: "1rem", borderRadius: "12px" }}></div>
                  <div className="skeleton" style={{ height: "20px", marginBottom: "0.5rem" }}></div>
                  <div className="skeleton" style={{ height: "20px", width: "60%" }}></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state-modern">
              <div className="empty-state-icon">
                <svg width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>No products found</h3>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
              <button onClick={resetFilters} className="btn-primary" style={{ padding: "0.75rem 2rem", borderRadius: "99px" }}>
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map(product => (
                  <div key={product._id || product.id} className="product-card">
                    <Link to={`/products/${product._id || product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="product-image">
                        {product.images && product.images.length > 0 ? (
                          <img src={getImageUrl(product.images[0])} alt={product.name} loading="lazy" />
                        ) : (
                          <div className="no-image">
                            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="product-details">
                        <p className="product-name">{product.name}</p>
                        <p className="product-price">PKR {product.price?.toLocaleString()}</p>

                        {product.freeDelivery === true && (
                          <FreeDeliveryBadge style={{ marginTop: "0.5rem" }} />
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        dispatch(addItemToWishlist(product._id || product.id));
                      }}
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "50%",
                        width: "36px",
                        height: "36px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-secondary)",
                        transition: "all 0.2s",
                        boxShadow: "0 2px 8px var(--shadow)",
                      }}
                      title="Add to Wishlist"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.1)";
                        e.currentTarget.style.color = "var(--danger)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListingPage;

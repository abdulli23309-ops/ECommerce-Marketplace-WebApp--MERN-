import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchApprovedProducts } from "../../services/productService";
import { getImageUrl } from "../../utils/imageHelper";
import { fetchCategories, fetchSubCategories } from "../../services/categoryService";
import { fetchBrands } from "../../services/brandService";

const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State for products, loading, etc.
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state
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

  // Load categories, brands on mount
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
  // Fetch products when filters or page change
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
        // Update URL params
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
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // reset to first page on filter change
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
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
    setCurrentPage(1);
  };

  return (
    <div className="listing-page">
      {/* Search Bar + Sort */}
      <div className="listing-toolbar">
        <form onSubmit={handleSearchSubmit} className="listing-search">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search products..."
            className="form-input"
          />
          <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0.5rem 1.5rem" }}>Search</button>
        </form>
        <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="form-input" style={{ width: "auto" }}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className="listing-content">
        {/* Filter Sidebar */}
        <aside className="listing-filters">
          <h3 className="filter-title">Filters</h3>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange} className="form-input">
              <option value="">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subcategory</label>
            <select name="subCategoryId" value={filters.subCategoryId} onChange={handleFilterChange} className="form-input">
              <option value="">All</option>
              {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Brand</label>
            <select name="brandId" value={filters.brandId} onChange={handleFilterChange} className="form-input">
              <option value="">All</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Min Price</label>
            <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} className="form-input" placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Max Price</label>
            <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} className="form-input" placeholder="any" />
          </div>
          <button className="btn-remove" onClick={resetFilters} style={{ marginTop: "1rem" }}>Clear Filters</button>
        </aside>

        {/* Product Grid */}
        <main className="listing-products">
          {loading ? (
            <p style={{ color: "#666" }}>Loading products...</p>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <p>No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map(product => (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </button>
                  <span className="page-info">Page {currentPage} of {totalPages}</span>
                  <button
                    className="page-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListingPage;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageHelper';
import PermissionGate from '../../components/common/PermissionGate';
import ProductDetailModal from './ProductDetailModal';
import { fetchSellerProducts, deleteProduct } from '../../services/sellerProductService';

const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSellerProducts({ page, pageSize: 12 });
      setProducts(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load products', err);
      setError('Could not load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page]);

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(productId);
      loadProducts();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: '#666' }}>Loading products...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif', color: '#111827' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Your Products</h2>
        <PermissionGate permission="Seller.Products.Create">
          <Link to="/seller/products/new" className="add-product-btn">+ Add Product</Link>
        </PermissionGate>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">You haven't added any products yet.</div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}>
            {products.map(product => (
              <div
                key={product._id}
                onClick={() => setSelectedProduct(product)}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ height: '180px', overflow: 'hidden' }}>
                  <img
                    src={getImageUrl(product.images?.[0]) || '/placeholder.png'}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => e.target.style.display = 'none'}
                  />
                </div>
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.name}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#000' }}>PKR {product.price?.toLocaleString()}</span>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Stock: {product.stockQuantity ?? product.stock ?? 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    {product.rating ? (
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>{product.rating} ★</span>
                    ) : <span style={{ color: '#9ca3af' }}>No rating</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <PermissionGate permission="Seller.Products.Edit">
                      <Link
                        to={`/seller/products/edit/${product._id}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          background: '#f3f4f6',
                          color: '#111827',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Edit
                      </Link>
                    </PermissionGate>
                    <PermissionGate permission="Seller.Products.Delete">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(product._id);
                        }}
                        style={{
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </PermissionGate>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default ProductGrid;
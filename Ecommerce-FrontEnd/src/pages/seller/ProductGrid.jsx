import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageHelper';
import PermissionGate from '../../components/common/PermissionGate';
import ProductDetailModal from './ProductDetailModal';
import { fetchSellerProducts, deleteProduct } from '../../services/sellerProductService';

// Status badge helper
const getBadgeStyle = (status) => {
  const base = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    zIndex: 2,
  };
  switch (status) {
    case 'Approved':
      return { ...base, backgroundColor: '#d1fae5', color: '#065f46' };
    case 'PendingApproval':
      return { ...base, backgroundColor: '#e5e7eb', color: '#374151' };
    case 'Rejected':
      return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' };
    case 'Suspended':
      return { ...base, backgroundColor: '#fef08a', color: '#854d0e' };
    default:
      return { ...base, backgroundColor: '#f3f4f6', color: '#1f2937' };
  }
};

const getBadgeText = (status) => {
  switch (status) {
    case 'Approved': return 'Live';
    case 'PendingApproval': return 'Under Review';
    case 'Rejected': return 'Action Required';
    case 'Suspended': return 'Suspended';
    default: return status;
  }
};

const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

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

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete._id);
      loadProducts();
      closeDeleteModal();
    } catch (err) {
      console.error('Failed to delete', err);
      closeDeleteModal();
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
            {products.map(product => {
              const isPending = product.status === 'PendingApproval';
              const isRejected = product.status === 'Rejected';
              const isSuspended = product.status === 'Suspended';
              const isInactive = isPending || isRejected || isSuspended;

              const badgeStyle = getBadgeStyle(product.status);
              const badgeText = getBadgeText(product.status);

              let warningBox = null;
              if (isRejected && product.rejectionReason) {
                warningBox = (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #f87171',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginTop: '12px',
                    marginBottom: '12px',
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#991b1b', lineHeight: '1.4' }}>
                      ⚠️ {product.rejectionReason}
                    </p>
                  </div>
                );
              } else if (isSuspended) {
                const reason = product.rejectionReason || product.internalNote || 'This product has been suspended by the admin.';
                warningBox = (
                  <div style={{
                    backgroundColor: '#fef9c3',
                    border: '1px solid #facc15',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginTop: '12px',
                    marginBottom: '12px',
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#854d0e', lineHeight: '1.4' }}>
                      ⚠️ Suspended: {reason}
                    </p>
                  </div>
                );
              } else if (isPending) {
                warningBox = (
                  <div style={{
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginTop: '12px',
                    marginBottom: '12px',
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#374151', lineHeight: '1.4' }}>
                      ⏳ Submission pending admin approval.
                    </p>
                  </div>
                );
              }

              const renderActionButton = () => {
                if (isRejected) {
                  return (
                    <Link
                      to={`/seller/products/edit/${product._id}`}
                      onClick={e => e.stopPropagation()}
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Fix Listing
                    </Link>
                  );
                }
                if (isSuspended) {
                  return (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        window.location.href = `/seller/products/edit/${product._id}`;
                      }}
                      style={{
                        backgroundColor: '#eab308',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Resolve Suspension
                    </button>
                  );
                }
                if (isPending) {
                  return (
                    <span style={{
                      color: '#6b7280',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      padding: '6px 16px',
                      background: '#f3f4f6',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      cursor: 'not-allowed',
                      display: 'inline-block',
                    }}>
                      Awaiting Review
                    </span>
                  );
                }
                return (
                  <Link
                    to={`/seller/products/edit/${product._id}`}
                    onClick={e => e.stopPropagation()}
                    style={{
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '6px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Edit
                  </Link>
                );
              };

              return (
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
                  <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                    <img
                      src={getImageUrl(product.images?.[0]) || '/placeholder.png'}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: isInactive ? (isPending ? 'grayscale(100%) opacity(60%)' : 'grayscale(100%) opacity(70%)') : 'none',
                      }}
                      onError={e => e.target.style.display = 'none'}
                    />
                    <div style={badgeStyle}>
                      {badgeText}
                    </div>
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
                      {product.avgRating > 0 ? (
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{product.avgRating} ★</span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>No rating</span>
                      )}
                    </div>

                    {warningBox}

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <PermissionGate permission="Seller.Products.Edit">
                        {renderActionButton()}
                      </PermissionGate>

                      <PermissionGate permission="Seller.Products.Delete">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            openDeleteModal(product);
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
              );
            })}
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

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {isDeleteModalOpen && productToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={closeDeleteModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '1rem' }}>
              <svg width="36" height="36" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              Delete Product?
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={closeDeleteModal}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
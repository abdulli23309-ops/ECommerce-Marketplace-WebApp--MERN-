import { useState, useEffect } from 'react';
import { getProducts, updateProductStatus } from '../../services/adminProductService';
import ProductInspectionModal from './ProductInspectionModal';
import { getImageUrl } from '../../utils/imageHelper';

const ProductModerationPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data.products || data);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

const handleStatusChange = async (productId, newStatus, reason, note) => {
  try {
    await updateProductStatus(productId, newStatus, reason, note);
    setProducts(prev =>
      prev.map(p => 
        p._id === productId 
          ? { ...p, status: newStatus, rejectionReason: reason, internalNote: note } 
          : p
      )
    );
  } catch (err) {
    console.error('Status update failed', err);
  }
};

  const metrics = {
    pendingApproval: products.filter(p => p.status === 'PendingApproval').length,
    highRiskFlags: products.filter(p => p.status === 'Suspended' || p.status === 'Rejected').length,
    approvedToday: products.filter(p => {
      if (p.status !== 'Approved') return false;
      const today = new Date();
      const updated = new Date(p.updatedAt);
      return updated.toDateString() === today.toDateString();
    }).length,
    rejectionRate: products.length
      ? ((products.filter(p => p.status === 'Rejected').length / products.length) * 100).toFixed(1) + '%'
      : '0%'
  };

  const getStatusBadgeStyle = (status) => {
    const base = {
      padding: '4px 12px',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      display: 'inline-block',
      textAlign: 'center',
      minWidth: '100px'
    };
    switch (status) {
      case 'Approved':
        return { ...base, background: '#dcfce7', color: '#166534' };
      case 'PendingApproval':
        return { ...base, background: '#fef9c3', color: '#854d0e' };
      case 'Suspended':
      case 'Rejected':
        return { ...base, background: '#fee2e2', color: '#991b1b' };
      default:
        return { ...base, background: '#f3f4f6', color: '#1f2937' };
    }
  };

  const getRiskBadge = (product) => {
    if (product.status === 'Suspended' || product.status === 'Rejected') {
      return (
        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
          {product.status}
        </span>
      );
    }
    return (
      <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
        Clean
      </span>
    );
  };

  if (loading) return <div style={{ padding: '2rem', color: '#666' }}>Loading moderation queue...</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif', color: '#111827' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.025em' }}>
        PRODUCT MODERATION
      </h1>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'PENDING APPROVAL', count: metrics.pendingApproval, accent: '#d97706' },
          { label: 'HIGH RISK FLAGS', count: metrics.highRiskFlags, accent: '#dc2626' },
          { label: 'APPROVED TODAY', count: metrics.approvedToday, accent: '#16a34a' },
          { label: 'REJECTION RATE', count: metrics.rejectionRate, accent: '#4b5563' }
        ].map((card, idx) => (
          <div key={idx} style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: card.accent, letterSpacing: '0.05em' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827' }}>{card.count}</div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Product</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Store / Seller</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Price & Stock</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Risk</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                {/* Product cell */}
                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <img
                      src={getImageUrl(product.images?.[0]) || '/placeholder.png'}
                      alt={product.name}
                      style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #e5e7eb' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{product.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {product._id.slice(-8)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {product.category?.name}
                        {product.subCategory?.name && ` > ${product.subCategory.name}`}
                      </div>
                    </div>
                  </div>
                </td>
                {/* Store cell */}
                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {product.store?.logo ? (
                      <img
                        src={getImageUrl(product.store.logo)}
                        alt={product.store.name}
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e5e7eb' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{product.store?.name || 'Unknown Store'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {/* We can’t show rating / listing count without extra queries, so omit */}
                        Store ID: {product.store?._id?.slice(-6) || '—'}
                      </div>
                    </div>
                  </div>
                </td>
                {/* Price & Stock */}
                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                  <div style={{ fontWeight: 600 }}>PKR {product.price.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Stock: {product.stock}</div>
                </td>
                {/* Risk */}
                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                  {getRiskBadge(product)}
                </td>
                {/* Status */}
                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                  <span style={getStatusBadgeStyle(product.status)}>{product.status}</span>
                </td>
                {/* Actions */}
                <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    style={{
                      background: '#111827',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 1rem',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#1f2937'}
                    onMouseLeave={(e) => e.target.style.background = '#111827'}
                  >
                    Inspect & Decide
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inspection Drawer */}
      {selectedProduct && (
        <ProductInspectionModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default ProductModerationPage;
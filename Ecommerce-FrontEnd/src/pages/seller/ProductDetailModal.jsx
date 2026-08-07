import { useState } from 'react';
import { getImageUrl } from '../../utils/imageHelper';

const ProductDetailModal = ({ product, onClose }) => {
  const [activeTab, setActiveTab] = useState('details');

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 999,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '2rem',
          boxSizing: 'border-box',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#111827',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280',
          }}
        >
          ×
        </button>

        {/* Product Image & Basic Info */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          <img
            src={getImageUrl(product.images?.[0]) || '/placeholder.png'}
            alt={product.name}
            style={{
              width: '240px',
              height: '240px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
            onError={e => e.target.src = '/placeholder.png'}
          />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{product.name}</h2>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>
              PKR {product.price?.toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ background: '#f3f4f6', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>
                {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
              </span>
              {product.rating && (
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                  {product.rating} ★
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e5e7eb', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              color: activeTab === 'details' ? '#111827' : '#6b7280',
              borderBottom: activeTab === 'details' ? '2px solid #111827' : 'none',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
          >
            Product Details
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              color: activeTab === 'reviews' ? '#111827' : '#6b7280',
              borderBottom: activeTab === 'reviews' ? '2px solid #111827' : 'none',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
          >
            Ratings & Reviews
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#4b5563' }}>Description</h4>
              <p style={{ lineHeight: '1.6', color: '#111827' }}>{product.description || 'No description provided.'}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Category:</span><br />
                <span>{product.category?.name || product.category || 'N/A'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Brand:</span><br />
                <span>{product.brand?.name || product.brand || 'N/A'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Created:</span><br />
                <span>{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Stock:</span><br />
                <span>{product.stock}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#4b5563' }}>Overall Rating</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                {product.rating ? `${product.rating} / 5 ★` : 'No ratings yet'}
              </p>
            </div>

            {product.reviews && product.reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {product.reviews.map((review, idx) => (
                  <div key={idx} style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{review.user || 'Anonymous'}</span>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                        {renderStars(review.rating)} {review.rating}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.5' }}>{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No reviews yet for this product.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetailModal;
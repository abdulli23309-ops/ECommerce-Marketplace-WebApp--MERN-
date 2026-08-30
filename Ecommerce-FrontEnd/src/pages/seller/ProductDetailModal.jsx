import { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageHelper';
import { formatPKR } from '../../utils/currency';
import axiosInstance from '../../services/axiosInstance';
import {
  PRODUCT_LOW_RATING_THRESHOLD,
  LOW_STOCK_THRESHOLD,
} from '../../utils/warningThresholds';

// Helper: warning state using imported thresholds
const isWarningState = (product) => {
  const rating = product.avgRating ?? product.averageRating ?? 0;
  const lowStock = Number(product.stock) <= LOW_STOCK_THRESHOLD;
  const lowRating = Number(rating) > 0 && Number(rating) < PRODUCT_LOW_RATING_THRESHOLD;
  return lowStock || lowRating;
};

const ProductDetailModal = ({ product, onClose }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const images = product?.images || [];
  const warning = isWarningState(product);

  // Fetch reviews when modal opens
  useEffect(() => {
    if (!product?._id) return;

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const res = await axiosInstance.get(`/reviews/product/${product._id}`);
        const data = res.data?.data || res.data;
        const reviewList = data?.items || (Array.isArray(data) ? data : []);
        setReviews(reviewList);
      } catch (err) {
        console.error('Failed to fetch reviews', err);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [product]);

  const goToPrevImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNextImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

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
          maxHeight: '75vh',
          background: warning
            ? 'linear-gradient(var(--danger-bg), var(--danger-bg)), var(--surface)'
            : 'var(--surface)',
          border: warning
            ? '1px solid var(--danger)'
            : '1px solid var(--border)',
          boxShadow: warning
            ? '0 0 24px var(--danger)'
            : '0 20px 60px rgba(0,0,0,0.2)',
          borderRadius: '12px',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '2rem',
          boxSizing: 'border-box',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: 'var(--text-primary)',
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
            color: 'var(--text-secondary)',
          }}
        >
          ×
        </button>

        {/* Warning banner */}
        {warning && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              marginBottom: '1rem',
              fontWeight: 600,
              color: 'var(--danger-text)',
            }}
          >
            ⚠️ {Number(product.stock) <= LOW_STOCK_THRESHOLD ? 'Low Stock' : 'Low Product Rating'} —{' '}
            {product.averageRating > 0
              ? `${Number(product.averageRating).toFixed(1)} average rating.`
              : `Stock: ${product.stock}`}
          </div>
        )}

        {/* Image Carousel */}
        {images.length > 0 && (
          <>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '300px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <img
                src={getImageUrl(images[currentImgIndex]) || '/placeholder.png'}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                }}
                onError={(e) => (e.target.src = '/placeholder.png')}
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={goToPrevImage}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '10px',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={goToNextImage}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '10px',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  marginBottom: '1.5rem',
                }}
              >
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(img) || '/placeholder.png'}
                    alt={`Thumbnail ${idx + 1}`}
                    onClick={() => setCurrentImgIndex(idx)}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border:
                        currentImgIndex === idx
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border)',
                      objectFit: 'cover',
                    }}
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Product Basic Info */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
              {product.name}
            </h2>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
              PKR {formatPKR(product.price)}
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
              </span>
              {product.avgRating > 0 && (
                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                  {product.avgRating} ★ ({product.reviewCount})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              color: activeTab === 'details' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'details' ? '2px solid var(--primary)' : 'none',
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
              color: activeTab === 'reviews' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'reviews' ? '2px solid var(--primary)' : 'none',
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
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Description</h4>
              <p style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
                {product.description || 'No description provided.'}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category:</span>
                <br />
                <span style={{ color: 'var(--text-primary)' }}>{product.category?.name || product.category || 'N/A'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Brand:</span>
                <br />
                <span style={{ color: 'var(--text-primary)' }}>{product.brand?.name || product.brand || 'N/A'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Created:</span>
                <br />
                <span style={{ color: 'var(--text-primary)' }}>{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Stock:</span>
                <br />
                <span style={{ color: 'var(--text-primary)' }}>{product.stock}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Overall Rating</h4>
              {product.avgRating > 0 ? (
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
                  {product.avgRating} / 5 ★ ({product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''})
                </p>
              ) : (
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-muted)' }}>No ratings yet</p>
              )}
              {product.status === 'Rejected' && product.rejectionReason && (
                <div style={{
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginTop: '12px',
                }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger-text)', lineHeight: '1.4' }}>
                    ⚠️ {product.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            {loadingReviews ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading reviews...</p>
            ) : reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((review, idx) => (
                  <div key={review._id || idx} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {review.customer?.name || 'Anonymous'}
                      </span>
                      <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                        {renderStars(review.rating)} {review.rating}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{review.comment}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      by {review.customer?.name || 'Anonymous'} on{' '}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No reviews yet for this product.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetailModal;
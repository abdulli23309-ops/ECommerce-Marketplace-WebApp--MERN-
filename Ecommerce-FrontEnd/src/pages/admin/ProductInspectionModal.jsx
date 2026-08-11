import { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageHelper';
import axiosInstance from '../../services/axiosInstance';

const ProductInspectionModal = ({ product, onClose, onStatusChange }) => {
  const [internalNote, setInternalNote] = useState('');
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const images = product?.images || [];

  // Fetch reviews when the modal opens
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

  const goToPrevImage = () => {
    setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    setCurrentImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Action handlers – they call the parent's onStatusChange
  const handleApprove = () => {
    onStatusChange(product._id, 'Approved', '', internalNote);
    onClose();
  };

  const handleReject = () => {
    if (!internalNote.trim()) return; // must provide a reason
    onStatusChange(product._id, 'Rejected', internalNote, ''); // note becomes rejection reason
    onClose();
  };

  const handleSuspend = () => {
    onStatusChange(product._id, 'Suspended', '', internalNote);
    onClose();
  };

  const handleResume = () => {
    onStatusChange(product._id, 'Approved', '', internalNote);
    onClose();
  };

  const store = product.store || {};
  const status = product.status;

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

      {/* Drawer (full‑height, right‑aligned) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '850px',
          maxWidth: '100vw',
          height: '100vh',
          background: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 2rem 1rem',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            Product Inspection
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Image Carousel */}
          {images.length > 0 && (
            <>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '300px',
                  backgroundColor: '#f3f4f6',
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
                    border: '1px solid #e5e7eb',
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
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        border: 'none',
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
                        color: '#111827',
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
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        border: 'none',
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
                        color: '#111827',
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
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
                            ? '2px solid #000'
                            : '1px solid #e5e7eb',
                        objectFit: 'cover',
                      }}
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Product Details */}
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {product.name}
          </h2>
          <p
            style={{
              color: '#4b5563',
              marginBottom: '0.75rem',
              lineHeight: '1.6',
              background: '#f9fafb',
              padding: '0.75rem',
              borderRadius: '6px',
            }}
          >
            {product.description || 'No description provided.'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Brand:</span>{' '}
              {product.brand?.name || 'N/A'}
            </div>
            <div>
              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Condition:</span> New
            </div>
            <div>
              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>ID:</span>{' '}
              {product._id.slice(-8)}
            </div>
            <div>
              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Created:</span>{' '}
              {new Date(product.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '16px',
              }}
            >
              Customer Reviews & Feedback
            </h3>
            {loadingReviews ? (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Loading reviews...
              </p>
            ) : reviews.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '14px', fontStyle: 'italic' }}>
                No reviews yet.
              </p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review._id}
                  style={{
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid #f3f4f6',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        color: '#eab308',
                        fontWeight: 'bold',
                        marginRight: '8px',
                      }}
                    >
                      ⭐ {review.rating}
                    </span>
                    <span
                      style={{
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '14px',
                      }}
                    >
                      {review.customer?.name || 'Anonymous'}
                    </span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        color: '#9ca3af',
                        fontSize: '12px',
                      }}
                    >
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: '#4b5563',
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                  >
                    {review.comment}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Seller Dossier Card */}
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '24px',
              background: '#fff',
            }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Seller Dossier
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {store.logo ? (
                <img
                  src={getImageUrl(store.logo)}
                  alt={store.name}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => (e.target.style.display = 'none')}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                  }}
                >
                  ?
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600 }}>
                  {store.name || 'Unknown'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {store.description?.slice(0, 40) || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer – Decision Area */}
        <div
          style={{
            padding: '24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#fff',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          {/* Dynamic buttons based on status */}
          {status === 'PendingApproval' && (
            <>
              {/* Internal note / rejection reason textarea */}
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={3}
                placeholder="Write an internal note or rejection reason…"
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  resize: 'vertical',
                }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleApprove}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #10b981',
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={handleReject}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ef4444',
                    backgroundColor: '#fef2f2',
                    color: '#b91c1c',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
              </div>
            </>
          )}

          {status === 'Approved' && (
            <button
              onClick={handleSuspend}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#ef4444',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Suspend Product
            </button>
          )}

          {status === 'Suspended' && (
            <button
              onClick={handleResume}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#10b981',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Resume Product
            </button>
          )}

          {status === 'Rejected' && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                color: '#991b1b',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              This product has been permanently rejected.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductInspectionModal;
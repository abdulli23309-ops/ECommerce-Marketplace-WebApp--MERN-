import { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageHelper';
import axiosInstance from '../../services/axiosInstance';

const isWarningState = (product) => {
  const lowStock = Number(product.stock) <= 5;
  const lowRating = product.averageRating > 0 && Number(product.averageRating) < 2.0;
  return lowStock || lowRating;
};

const ProductInspectionModal = ({ product, onClose, onStatusChange }) => {
  const [internalNote, setInternalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  const reviewPageSize = 5;

  const images = product?.images || [];

  useEffect(() => {
    if (!product?._id) return;

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const res = await axiosInstance.get(`/reviews/product/${product._id}`, {
          params: { page: reviewsPage, pageSize: reviewPageSize },
        });
        const data = res.data?.data || {};
        const items = data.items || (Array.isArray(data) ? data : []);
        setReviews(items);
        setTotalReviewPages(data.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch reviews', err);
        setReviews([]);
        setTotalReviewPages(1);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [product, reviewsPage]);

  useEffect(() => {
    setReviewsPage(1);
  }, [product?._id]);

  useEffect(() => {
    if (product?.status === 'Rejected') {
      setRejectionReason(product.rejectionReason || '');
      setInternalNote(product.internalNote || '');
    } else {
      setRejectionReason('');
      setInternalNote('');
    }
  }, [product]);

  const goToPrevImage = () => {
    setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    setCurrentImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleApprove = () => {
    onStatusChange(product._id, 'Approved', '', internalNote);
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    onStatusChange(product._id, 'Rejected', rejectionReason, internalNote);
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
  const warning = isWarningState(product);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 999,
        }}
      />

   <div
  style={{
    position: 'fixed',
    top: 0,
    right: 0,
    width: '850px',
    maxWidth: '100vw',
    height: '100vh',
    background: warning
      ? 'linear-gradient(rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.15)), var(--surface)'
      : 'var(--surface)',
    border: warning
      ? '1px solid rgba(239, 68, 68, 0.45)'
      : '1px solid var(--border)',
    boxShadow: warning
      ? '0 0 24px rgba(239, 68, 68, 0.25)'
      : '-4px 0 24px rgba(0,0,0,0.1)',
    color: 'var(--text-primary)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  }}
>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 2rem 1rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Product Inspection
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
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
                        color: 'var(--text-primary)',
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
                        color: 'var(--text-primary)',
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

          {warning && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.45)',
                marginBottom: '1rem',
                fontWeight: 600,
              }}
            >
              ⚠️ {Number(product.stock) <= 5 ? 'Low Stock' : 'Low Product Rating'} —{' '}
              {product.averageRating > 0
                ? `${Number(product.averageRating).toFixed(1)} average rating.`
                : `Stock: ${product.stock}`}
            </div>
          )}

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            {product.name}
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem',
              lineHeight: '1.6',
              background: 'var(--bg-secondary)',
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
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Brand:</span>{' '}
              {product.brand?.name || 'N/A'}
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Condition:</span> New
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>ID:</span>{' '}
              {product._id.slice(-8)}
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Created:</span>{' '}
              {new Date(product.createdAt).toLocaleDateString()}
            </div>
          </div>

          {status === 'Rejected' && (
            <div style={{ marginBottom: '1.5rem' }}>
              {rejectionReason && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--danger-bg)',
                    border: '1px solid var(--danger)',
                    color: 'var(--danger-text)',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                  }}
                >
                  <strong>Rejection Reason (seller sees this):</strong>
                  <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{rejectionReason}</p>
                </div>
              )}
              {internalNote && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--warning-bg)',
                    border: '1px solid var(--warning)',
                    color: 'var(--warning-text)',
                    borderRadius: '8px',
                  }}
                >
                  <strong>Internal Admin Notes:</strong>
                  <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{internalNote}</p>
                </div>
              )}
            </div>
          )}

          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                marginBottom: '16px',
              }}
            >
              Customer Reviews & Feedback
            </h3>
            {loadingReviews ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Loading reviews...
              </p>
            ) : reviews.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
                No reviews yet.
              </p>
            ) : (
              <>
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      border: '1px solid var(--border)',
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
                          color: 'var(--warning)',
                          fontWeight: 'bold',
                          marginRight: '8px',
                        }}
                      >
                        ⭐ {review.rating}
                      </span>
                      <span
                        style={{
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                        }}
                      >
                        {review.customer?.name || 'Anonymous'}
                      </span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                        }}
                      >
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        lineHeight: '1.5',
                      }}
                    >
                      {review.comment}
                    </p>
                    {review.sellerReply && (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        backgroundColor: 'var(--success-bg)',
                        border: '1px solid var(--success)',
                        borderRadius: '6px'
                      }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '12px',
                          marginBottom: '4px',
                          color: 'var(--success-text)'
                        }}>
                          Seller Reply
                        </div>
                        <p style={{
                          margin: 0,
                          color: 'var(--success-text)',
                          fontSize: '13px',
                          lineHeight: '1.5'
                        }}>
                          {review.sellerReply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {totalReviewPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '1rem',
                      marginTop: '1rem',
                    }}
                  >
                    <button
                      className="page-btn"
                      disabled={reviewsPage <= 1}
                      onClick={() => setReviewsPage((prev) => Math.max(1, prev - 1))}
                    >
                      Previous
                    </button>
                    <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Page {reviewsPage} of {totalReviewPages}
                    </span>
                    <button
                      className="page-btn"
                      disabled={reviewsPage >= totalReviewPages}
                      onClick={() => setReviewsPage((prev) => Math.min(totalReviewPages, prev + 1))}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '24px',
              background: 'var(--surface)',
            }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
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
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  ?
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {store.name || 'Unknown'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {store.description?.slice(0, 40) || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '24px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          {status === 'PendingApproval' && (
            <>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                placeholder="Rejection reason (visible to seller)…"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  fontSize: '0.85rem',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  resize: 'vertical',
                }}
              />
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={2}
                placeholder="Internal notes (admin only)…"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
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
                    border: '1px solid var(--success)',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success-text)',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--danger)',
                    backgroundColor: 'var(--danger-bg)',
                    color: 'var(--danger-text)',
                    fontWeight: '600',
                    cursor: !rejectionReason.trim() ? 'not-allowed' : 'pointer',
                    opacity: !rejectionReason.trim() ? 0.6 : 1,
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
                backgroundColor: 'var(--danger)',
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
                backgroundColor: 'var(--success)',
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
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger)',
                color: 'var(--danger-text)',
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
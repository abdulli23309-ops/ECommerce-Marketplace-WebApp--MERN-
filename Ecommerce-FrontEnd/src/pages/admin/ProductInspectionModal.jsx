import { useState } from 'react';
import { getImageUrl } from '../../utils/imageHelper';

const ProductInspectionModal = ({ product, onClose, onStatusChange }) => {
  const [decision, setDecision] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const handleSubmit = async () => {
    if (!decision) return;
    const status = decision === 'approve' ? 'Approved' : 'Rejected';
    // This calls the parent's handleStatusChange with all four arguments.
    // Ensure the parent handler accepts (productId, newStatus, reason, note).
    await onStatusChange(product._id, status, rejectionReason, adminNote);
    onClose();
  };

  const store = product.store || {};

  const rejectionOptions = [
    'Price Anomaly',
    'Incomplete Information',
    'Prohibited Item',
    'Copyright Violation',
  ];

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

      {/* Drawer */}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
          {/* LEFT COLUMN – Product details */}
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <img
                  src={getImageUrl(product.images?.[0]) || '/placeholder.png'}
                  alt="Primary"
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                  onError={(e) => {
                    e.target.src = '/placeholder.png';
                  }}
                />
                {product.images?.slice(1).map((img, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`Secondary ${idx + 1}`}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ))}
                {[...Array(Math.max(0, 2 - (product.images?.length || 1)))].map((_, idx) => (
                  <div
                    key={`placeholder-${idx}`}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '8px',
                      border: '1px dashed #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: '0.75rem',
                    }}
                  >
                    No Image
                  </div>
                ))}
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {product.name}
            </h2>
            <p
              style={{
                color: '#4b5563',
                marginBottom: '0.75rem',
                lineHeight: '1.5',
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
          </div>

          {/* RIGHT COLUMN – Seller Dossier & Decision */}
          <div>
            {/* Seller Dossier Card */}
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                background: '#fff',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Seller Dossier
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
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
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
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
                  <div style={{ fontWeight: 600 }}>{store.name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {store.description?.slice(0, 40) || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Decision Form */}
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                background: '#fff',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Decision
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <button
                  onClick={() => setDecision('approve')}
                  style={{
                    background: decision === 'approve' ? '#166534' : '#f0fdf4',
                    color: decision === 'approve' ? '#fff' : '#166534',
                    border: '1px solid #16a34a',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => setDecision('reject')}
                  style={{
                    background: decision === 'reject' ? '#991b1b' : '#fef2f2',
                    color: decision === 'reject' ? '#fff' : '#991b1b',
                    border: '1px solid #dc2626',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
              </div>

              {decision === 'reject' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Rejection Reason
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: '#fff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="">Select reason...</option>
                    {rejectionOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: '0.25rem',
                  }}
                >
                  Internal Note
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder="Private audit comments..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    resize: 'vertical',
                    fontSize: '0.85rem',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!decision}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: decision ? '#111827' : '#e5e7eb',
                  color: decision ? '#fff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: decision ? 'pointer' : 'not-allowed',
                }}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductInspectionModal;
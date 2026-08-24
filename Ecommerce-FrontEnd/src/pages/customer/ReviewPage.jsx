import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";

const RATING_LABELS = {
  1: "😞 Poor - Not what I expected",
  2: "😕 Could be better",
  3: "😐 It's okay",
  4: "😊 Good - I like it!",
  5: "🤩 Excellent - Love it!",
};

const ReviewPage = () => {
  const { sellerOrderId } = useParams();
  const navigate = useNavigate();

  const [sellerOrder, setSellerOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const maxCommentLength = 500;

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_FILES = 5;

  useEffect(() => {
    const fetchSellerOrder = async () => {
      try {
        const res = await axiosInstance.get(`/orders/seller-orders/${sellerOrderId}`);
        const data = res.data?.data || res.data;
        setSellerOrder(data);
      } catch (err) {
        console.error("Failed to load order details", err);
        setError("Could not load order details.");
      } finally {
        setLoadingOrder(false);
      }
    };
    fetchSellerOrder();
  }, [sellerOrderId]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles((prev) => {
      const combined = [...prev, ...files].slice(0, MAX_FILES);
      return combined;
    });
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      setSelectedFiles((prev) => {
        const combined = [...prev, ...files].slice(0, MAX_FILES);
        return combined;
      });
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return [];
    setUploadingImages(true);
    try {
      const urls = [];
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("images", file);
        const { data } = await axiosInstance.post("/reviews/upload-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        urls.push(data.data?.url || data.url);
      }
      return urls;
    } catch (err) {
      throw new Error("Image upload failed.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError("Please select a rating.");
      return;
    }

    const productField = sellerOrder?.items?.[0]?.product;
    const productId = productField?._id || productField;
    if (!productId) {
      setError("Product information is missing.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const imageUrls = await uploadImages();

      await axiosInstance.post("/reviews", {
        sellerOrderId,
        productId,
        rating,
        comment,
        images: imageUrls,
      });
      navigate("/orders");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit review.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOrder) return (
    <div className="animate-fade-in" style={{ maxWidth: "700px", margin: "2rem auto", padding: "2rem" }}>
      <div className="skeleton" style={{ height: "40px", width: "100px", marginBottom: "2rem" }}></div>
      <div className="modern-card" style={{ padding: "2rem" }}>
        <div className="skeleton" style={{ height: "80px", marginBottom: "2rem" }}></div>
        <div className="skeleton" style={{ height: "60px", marginBottom: "1.5rem" }}></div>
        <div className="skeleton" style={{ height: "120px", marginBottom: "1.5rem" }}></div>
      </div>
    </div>
  );

  if (!sellerOrder) return (
    <div className="empty-state-modern animate-fade-in" style={{ maxWidth: "500px", margin: "4rem auto" }}>
      <div className="empty-state-icon">
        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3>Order not found</h3>
      <p>We couldn't find the order details. Please try again.</p>
      <button onClick={() => navigate("/orders")} className="btn-primary" style={{ padding: "0.75rem 2rem", borderRadius: "99px" }}>
        Back to Orders
      </button>
    </div>
  );

  const product = sellerOrder.items?.[0];
  const productName = product?.productNameSnapshot || "Product";
  const productImage = product?.product?.images?.[0];
  const storeName = sellerOrder.store?.name || "Unknown Store";

  const displayRating = hoveredRating || rating;

  return (
    <div className="animate-fade-in" style={{
      maxWidth: "700px", margin: "2rem auto", padding: "2rem",
      background: "var(--surface)", borderRadius: "16px", boxShadow: "0 4px 12px var(--shadow)",
      fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)", border: "1px solid var(--border)",
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          fontSize: "0.9rem",
          cursor: "pointer",
          marginBottom: "1.5rem",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <div style={{
        display: "flex", gap: "1rem", alignItems: "center",
        paddingBottom: "1.5rem", marginBottom: "2rem",
        borderBottom: "2px solid var(--border)",
      }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "12px", overflow: "hidden", background: "var(--bg-secondary)", border: "2px solid var(--border)", flexShrink: 0 }}>
          {productImage ? (
            <img src={getImageUrl(productImage)} alt={productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem" }}>{productName}</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Sold by <strong>{storeName}</strong>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Interactive Star Rating */}
        <div className="form-group" style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: "1rem", fontSize: "1.05rem" }}>
            How would you rate this product?
          </label>
          <div className="star-rating-interactive">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${(hoveredRating ? star <= hoveredRating : star <= rating) ? 'filled' : 'empty'}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                ★
              </span>
            ))}
          </div>
          <div className={`rating-label ${displayRating > 0 ? 'visible' : 'hidden'}`}>
            {RATING_LABELS[displayRating] || ''}
          </div>
        </div>

        {/* Comment */}
        <div className="form-group" style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: "0.75rem", fontSize: "1.05rem" }}>
            Share your experience (optional)
          </label>
          <textarea
            className="form-input"
            rows={5}
            maxLength={maxCommentLength}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you loved (or didn't) about this product. Your feedback helps other shoppers!"
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: "8px",
              padding: "1rem",
              border: "2px solid var(--border)",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.95rem",
              background: "var(--input-bg)",
              outline: "none",
              transition: "border-color 0.2s",
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "0.5rem",
          }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {comment.length > 0 ? `${comment.length} characters` : 'No characters yet'}
            </span>
            <span style={{ fontSize: "0.8rem", color: comment.length >= maxCommentLength ? "var(--danger)" : "var(--text-muted)" }}>
              {maxCommentLength - comment.length} remaining
            </span>
          </div>
        </div>

        {/* Drag & Drop Image Upload */}
        <div className="form-group" style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: "0.75rem", fontSize: "1.05rem" }}>
            Add Photos (optional, up to {MAX_FILES})
          </label>

          <div
            className={`drag-drop-zone ${isDragging ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              pointerEvents: selectedFiles.length >= MAX_FILES ? 'none' : 'auto',
              opacity: selectedFiles.length >= MAX_FILES ? 0.6 : 1,
            }}
          >
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 0.25rem" }}>
              {selectedFiles.length >= MAX_FILES ? 'Maximum files reached' : 'Drop your photos here'}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
              or click to browse • JPG, PNG, WEBP
            </p>
          </div>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: "none" }}
          />

          {/* Image Preview Grid */}
          {selectedFiles.length > 0 && (
            <div className="image-preview-grid" style={{ marginTop: "1.5rem" }}>
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="image-preview-item">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="image-remove-btn"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: "var(--danger-bg)",
            border: "1px solid var(--danger)",
            color: "var(--danger-text)",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={submitting || uploadingImages || !rating}
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.05rem",
            fontWeight: 700,
            borderRadius: "12px",
            border: "none",
            background: rating ? "var(--primary)" : "var(--disabled-bg)",
            color: rating ? "var(--primary-contrast)" : "var(--disabled-text)",
            cursor: rating ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            boxShadow: rating ? "0 4px 12px var(--shadow)" : "none",
          }}
          onMouseEnter={(e) => {
            if (rating && !submitting && !uploadingImages) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px var(--shadow)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = rating ? "0 4px 12px var(--shadow)" : "none";
          }}
        >
          {submitting || uploadingImages ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", verticalAlign: "middle", marginRight: "0.5rem", animation: "spin 1s linear infinite" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {uploadingImages ? 'Uploading photos...' : 'Submitting...'}
            </>
          ) : (
            '✨ Submit Review'
          )}
        </button>
      </form>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ReviewPage;

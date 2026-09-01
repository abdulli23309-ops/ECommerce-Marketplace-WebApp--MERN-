import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { fetchMyReviews } from "../../services/reviewService";
import { getImageUrl } from "../../utils/imageHelper";
import { formatPKR } from "../../utils/currency";

const RATING_LABELS = {
  1: "😞 Poor - Not what I expected",
  2: "😕 Could be better",
  3: "😐 It's okay",
  4: "😊 Good - I like it!",
  5: "🤩 Excellent - Love it!",
};

const ReviewPage = () => {
  const { sellerOrderId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryProductId = searchParams.get("productId");
  const navigate = useNavigate();

  const [sellerOrder, setSellerOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
  const [selectedProductId, setSelectedProductId] = useState(queryProductId || null);

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const maxCommentLength = 500;

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_FILES = 5;

  useEffect(() => {
    const fetchOrderAndReviews = async () => {
      try {
        const [orderRes, reviewsRes] = await Promise.all([
          axiosInstance.get(`/orders/seller-orders/${sellerOrderId}`),
          fetchMyReviews({ pageSize: 100 }).catch(() => ({ items: [] })),
        ]);

        const orderData = orderRes.data?.data || orderRes.data;
        setSellerOrder(orderData);

        const myReviews = reviewsRes.items || [];
        const reviewedIds = new Set(
          myReviews
            .filter((r) => (r.sellerOrder?._id || r.sellerOrder)?.toString() === sellerOrderId)
            .map((r) => (r.product?._id || r.product)?.toString())
        );
        setReviewedProductIds(reviewedIds);

        const items = orderData?.items || [];
        if (queryProductId) {
          setSelectedProductId(queryProductId);
        } else if (items.length === 1) {
          const firstId = (items[0].product?._id || items[0].product)?.toString();
          setSelectedProductId(firstId);
        }
      } catch (err) {
        console.error("Failed to load order details", err);
        setError("Could not load order details.");
      } finally {
        setLoadingOrder(false);
      }
    };
    fetchOrderAndReviews();
  }, [sellerOrderId, queryProductId]);

  const handleSelectProduct = (pId) => {
    setSelectedProductId(pId);
    setSearchParams({ productId: pId });
    setRating(0);
    setComment("");
    setSelectedFiles([]);
    setError(null);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles((prev) => {
      const combined = [...prev, ...files].slice(0, MAX_FILES);
      return combined;
    });
    e.target.value = "";
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

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
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
    if (!selectedProductId) {
      setError("Please choose a product to review.");
      return;
    }
    if (!rating) {
      setError("Please select a rating.");
      return;
    }

              setSubmitting(true);
      setError(null);
      try {
      const imageUrls = await uploadImages();
      const productSnapshot = {
        _id: selectedProductId,
        name: selectedItem?.productNameSnapshot || "this item",
        image: selectedItem?.productImage || selectedItem?.product?.images?.[0],
      };
      const { data } = await axiosInstance.post("/reviews", {
        sellerOrderId,
        productId: selectedProductId,
        rating,
        comment,
        images: imageUrls,
        isAnonymous,
      });

            const createdReview = data?.data || data || {};

      navigate("/review/success", {
        state: {
          review: createdReview,
          product: createdReview?.product || productSnapshot,
          rating,
          comment,
          isAnonymous,
        },
      });
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

  if (loadingOrder) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: "700px", margin: "2rem auto", padding: "2rem" }}>
        <div className="skeleton" style={{ height: "40px", width: "100px", marginBottom: "2rem" }} />
        <div className="modern-card" style={{ padding: "2rem" }}>
          <div className="skeleton" style={{ height: "80px", marginBottom: "2rem" }} />
          <div className="skeleton" style={{ height: "60px", marginBottom: "1.5rem" }} />
          <div className="skeleton" style={{ height: "120px", marginBottom: "1.5rem" }} />
        </div>
      </div>
    );
  }

  if (!sellerOrder) {
    return (
      <div className="empty-state-modern animate-fade-in" style={{ maxWidth: "500px", margin: "4rem auto" }}>
        <div className="empty-state-icon">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3>Order not found</h3>
        <p>We couldn't find the order details. Please try again.</p>
        <button onClick={() => navigate("/orders")} className="btn-primary" style={{ padding: "0.75rem 2rem", borderRadius: "99px" }}>
          Back to Orders
        </button>
      </div>
    );
  }

  const items = sellerOrder.items || [];
  const storeName = sellerOrder.store?.name || "Unknown Store";

  const selectedItem = items.find((item) => {
    const pId = (item.product?._id || item.product)?.toString();
    return pId === selectedProductId?.toString();
  });

  const displayRating = hoveredRating || rating;

  return (
    <div
      className="animate-fade-in"
      style={{
        maxWidth: "700px",
        margin: "2rem auto",
        padding: "2rem",
        background: "var(--surface)",
        borderRadius: "16px",
        boxShadow: "0 4px 12px var(--shadow)",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "var(--text-primary)",
        border: "1px solid var(--border)",
      }}
    >
      <button
        type="button"
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
        Back to Order
      </button>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.25rem" }}>
          Write a Review
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
          Order from <strong>{storeName}</strong> · #{sellerOrder._id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Multiple Products Selection (when seller order contains > 1 item) */}
      {items.length > 1 && (
        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem" }}>
            Select the product you want to review:
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {items.map((item, idx) => {
              const pId = (item.product?._id || item.product)?.toString();
              const isSelected = selectedProductId === pId;
              const isAlreadyReviewed = reviewedProductIds.has(pId);
              const pImg = item.productImage || item.product?.images?.[0];

              return (
                <div
                  key={idx}
                  onClick={() => !isAlreadyReviewed && handleSelectProduct(pId)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                    background: isSelected ? "var(--bg-secondary)" : isAlreadyReviewed ? "var(--disabled-bg)" : "var(--surface)",
                    cursor: isAlreadyReviewed ? "not-allowed" : "pointer",
                    opacity: isAlreadyReviewed ? 0.7 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "var(--bg-secondary)",
                      flexShrink: 0,
                    }}
                  >
                    {pImg ? (
                      <img src={getImageUrl(pImg)} alt={item.productNameSnapshot} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        No image
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                      {item.productNameSnapshot}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      Qty {item.quantity} · PKR {formatPKR(item.unitPriceSnapshot)}
                    </div>
                  </div>

                  <div>
                    {isAlreadyReviewed ? (
                      <span style={{ fontSize: "0.8rem", color: "var(--success-text)", fontWeight: 600, padding: "4px 8px", background: "var(--success-bg)", borderRadius: "6px" }}>
                        Reviewed ✓
                      </span>
                    ) : isSelected ? (
                      <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700 }}>
                        Selected ●
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        Select
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Product Banner */}
      {selectedItem ? (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            padding: "1rem",
            marginBottom: "2rem",
            background: "var(--bg-secondary)",
            borderRadius: "12px",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "8px",
              overflow: "hidden",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            {selectedItem.product?.images?.[0] || selectedItem.productImage ? (
              <img
                src={getImageUrl(selectedItem.product?.images?.[0] || selectedItem.productImage)}
                alt={selectedItem.productNameSnapshot}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.25rem" }}>
              {selectedItem.productNameSnapshot}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
              Sold by <strong>{storeName}</strong>
            </p>
          </div>
        </div>
      ) : (
        <div style={{ padding: "1.5rem", textAlign: "center", background: "var(--bg-secondary)", borderRadius: "12px", marginBottom: "2rem", color: "var(--text-secondary)" }}>
          Please select a product above to leave a review.
        </div>
      )}

      {selectedItem && (
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
                  className={`star ${(hoveredRating ? star <= hoveredRating : star <= rating) ? "filled" : "empty"}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  ★
                </span>
              ))}
            </div>
            <div className={`rating-label ${displayRating > 0 ? "visible" : "hidden"}`}>
              {RATING_LABELS[displayRating] || ""}
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "0.5rem",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {comment.length > 0 ? `${comment.length} characters` : "No characters yet"}
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
              className={`drag-drop-zone ${isDragging ? "drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                pointerEvents: selectedFiles.length >= MAX_FILES ? "none" : "auto",
                opacity: selectedFiles.length >= MAX_FILES ? 0.6 : 1,
              }}
            >
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 0.25rem" }}>
                {selectedFiles.length >= MAX_FILES ? "Maximum files reached" : "Drop your photos here"}
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
                    <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} />
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

          {/* Anonymous Review Option */}
          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                cursor: "pointer",
                padding: "14px 16px",
                borderRadius: "12px",
                background: isAnonymous ? "var(--primary-bg, rgba(99, 102, 241, 0.08))" : "var(--bg-secondary)",
                border: isAnonymous ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{
                  marginTop: "3px",
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--primary)",
                  cursor: "pointer",
                }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                  Post this review anonymously
                </span>
                <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  Your identifying display name will be hidden from other shoppers and shown as <strong>Anonymous Customer</strong>.
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div
              style={{
                background: "var(--danger-bg)",
                border: "1px solid var(--danger)",
                color: "var(--danger-text)",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
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
                {uploadingImages ? "Uploading photos..." : "Submitting..."}
              </>
            ) : (
              "✨ Submit Review"
            )}
          </button>
        </form>
      )}

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

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";

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

  // Image upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);

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

  // Handle file selection for review images
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setSelectedFiles(files);
    const previews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  // Upload selected images and return an array of URLs
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
      // Upload images first (if any)
      const imageUrls = await uploadImages();

      await axiosInstance.post("/reviews", {
        sellerOrderId,
        productId,
        rating,
        comment,
        images: imageUrls,   // now includes uploaded image URLs
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

  if (loadingOrder) return <div style={{ padding: "2rem", color: "#666" }}>Loading...</div>;
  if (!sellerOrder) return <div style={{ padding: "2rem", color: "#666" }}>Order details not found.</div>;

  const product = sellerOrder.items?.[0];
  const productName = product?.productNameSnapshot || "Product";
  const productImage = product?.product?.images?.[0];   // first product image
  const storeName = sellerOrder.store?.name || "Unknown Store";

  return (
    <div style={{
      maxWidth: "600px", margin: "2rem auto", padding: "2rem",
      background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      fontFamily: "Inter, system-ui, sans-serif", color: "#111827",
    }}>
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", color: "#6b7280", fontSize: "0.9rem", cursor: "pointer", marginBottom: "1.5rem", padding: 0 }}
      >
        ← Back
      </button>

      {/* Product context */}
      <div style={{
        display: "flex", gap: "1rem", alignItems: "center",
        paddingBottom: "1.5rem", marginBottom: "1.5rem",
        borderBottom: "1px solid #f3f4f6",
      }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", background: "#f3f4f6" }}>
          {productImage ? (
            <img src={getImageUrl(productImage)} alt={productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.25rem" }}>{productName}</h2>
          <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0 }}>Sold by {storeName}</p>
        </div>
      </div>

      {/* Review form */}
      <form onSubmit={handleSubmit}>
        {/* Star Rating */}
        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>Your Rating</label>
          <div style={{ display: "flex", gap: "0.25rem", fontSize: "2rem", cursor: "pointer" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                style={{ color: (hoveredRating ? star <= hoveredRating : star <= rating) ? "#f59e0b" : "#e5e7eb", transition: "color 0.1s" }}
              >★</span>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>Your Review (optional)</label>
          <textarea
            className="form-input"
            rows={5}
            maxLength={maxCommentLength}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you love about this product? Share your experience..."
            style={{ width: "100%", boxSizing: "border-box", borderRadius: "6px", padding: "0.75rem", border: "1px solid #d1d5db", fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.9rem", background: "#f9fafb", outline: "none" }}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>{comment.length} / {maxCommentLength}</div>
        </div>

        {/* Image Upload */}
        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>Add Photos (optional)</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ marginBottom: "0.5rem" }}
          />
          {imagePreviews.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {imagePreviews.map((preview, idx) => (
                <img key={idx} src={preview} alt={`Preview ${idx}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e5e7eb" }} />
              ))}
            </div>
          )}
        </div>

        {error && <p style={{ color: "#d11a2a", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</p>}

        <button
          type="submit"
          className="btn-primary"
          disabled={submitting || uploadingImages || !rating}
          style={{
            width: "100%", padding: "0.75rem", fontSize: "1rem", fontWeight: 600,
            borderRadius: "8px", border: "none", background: rating ? "#111827" : "#e5e7eb",
            color: rating ? "#fff" : "#9ca3af", cursor: rating ? "pointer" : "not-allowed",
            transition: "background 0.2s, transform 0.1s",
          }}
        >
          {submitting || uploadingImages ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewPage;
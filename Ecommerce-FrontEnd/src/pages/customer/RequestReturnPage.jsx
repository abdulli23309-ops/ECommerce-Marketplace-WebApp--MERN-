import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";

const RequestReturnPage = () => {
  const { sellerOrderId } = useParams();
  const navigate = useNavigate();

  // Product data from seller order
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  // Form state
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch seller order to display product context
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axiosInstance.get(`/orders/seller-orders/${sellerOrderId}`);
        const data = res.data?.data || res.data;
        setOrderDetails(data);
      } catch (err) {
        console.error("Failed to load order details", err);
        setError("Unable to load order information.");
      } finally {
        setLoadingOrder(false);
      }
    };
    fetchOrder();
  }, [sellerOrderId]);

  // Handle file selection (drag & drop / click)
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || e.dataTransfer.files);
    if (selectedFiles.length === 0) return;
    setFiles((prev) => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileSelect(e);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select a return reason.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Get productId from the order
      const productField = orderDetails?.items?.[0]?.product;
      const productId = productField?._id || productField;
      if (!productId) {
        setError("Could not identify product.");
        setSubmitting(false);
        return;
      }

      // 2. Upload images (if any) to the dedicated upload endpoint
      let imageUrls = [];
      if (files.length > 0) {
        setUploading(true);
        for (const file of files) {
          const formData = new FormData();
          formData.append("images", file);
          const { data } = await axiosInstance.post("/returns/upload-image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const uploadedUrl = data.data?.url || data.url;
          if (uploadedUrl) imageUrls.push(uploadedUrl);
        }
        setUploading(false);
      }

      // 3. Submit return request
      await axiosInstance.post("/returns", {
        sellerOrderId,
        productId,
        reason,
        description,
        images: imageUrls,
      });

      navigate("/orders"); // go back to orders after success
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to submit return request.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const product = orderDetails?.items?.[0];
  const productName = product?.productNameSnapshot || "Product";
  const productImage = product?.product?.images?.[0];
  const storeName = orderDetails?.store?.name || "Unknown Store";
  const price = product
    ? (product.unitPriceSnapshot || 0) * (product.quantity || 1)
    : orderDetails?.subTotal || 0;

  const returnReasons = [
    "Item is defective/broken",
    "Wrong item received",
    "Item doesn't match description",
    "No longer needed",
    "Other",
  ];

  if (loadingOrder) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>Loading…</div>;
  }

  if (!orderDetails) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>
        <p>Order details not found.</p>
        <Link to="/orders" style={{ color: "#111827", fontWeight: 600 }}>Back to Orders</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "640px", margin: "2rem auto", padding: "2rem" }}>
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: "#6b7280",
          fontSize: "0.9rem",
          cursor: "pointer",
          marginBottom: "1.5rem",
          padding: 0,
        }}
      >
        ← Back
      </button>

      {/* Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          padding: "2rem",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#111827",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          Request a Return
        </h2>
        <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Please fill out the details below to initiate your return.
        </p>

        {/* Product context */}
        <div
          style={{
            background: "#f9fafb",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "1.5rem",
            display: "flex",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <div style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", background: "#f3f4f6", flexShrink: 0 }}>
            {productImage ? (
              <img
                src={getImageUrl(productImage)}
                alt={productName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <p style={{ fontWeight: 600, margin: 0 }}>{productName}</p>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: "2px 0 0" }}>
              Sold by {storeName}
            </p>
            <p style={{ fontWeight: 600, color: "#111827", margin: "4px 0 0" }}>
              PKR {price.toLocaleString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Reason dropdown */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              Reason for Return
            </label>
            <select
              className="form-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              style={{ width: "100%", boxSizing: "border-box", borderRadius: "6px", padding: "0.6rem", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
            >
              <option value="">Select a reason</option>
              {returnReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Additional details */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              Additional Details (optional)
            </label>
            <textarea
              className="form-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any extra information that might help us process your return..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "6px",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                fontSize: "0.9rem",
                fontFamily: "Inter, system-ui, sans-serif",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#111827")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {/* Image Dropzone */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              Attach Photos (optional)
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #d1d5db",
                borderRadius: "8px",
                padding: "2rem",
                textAlign: "center",
                cursor: "pointer",
                background: "#f9fafb",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#9ca3af")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
            >
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#9ca3af"
                viewBox="0 0 24 24"
                style={{ marginBottom: "0.5rem" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: 0 }}>
                Click to upload or drag and drop photos
              </p>
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                PNG, JPG up to 5MB
              </p>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                onChange={handleFileSelect}
              />
            </div>

            {/* Image previews */}
            {previews.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                {previews.map((preview, idx) => (
                  <div key={idx} style={{ position: "relative", width: "80px", height: "80px" }}>
                    <img
                      src={preview}
                      alt={`Preview ${idx}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Policy info */}
          <div
            style={{
              background: "#eff6ff",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              fontSize: "0.85rem",
              color: "#1e40af",
              lineHeight: "1.5",
            }}
          >
            <p style={{ margin: 0 }}>
              Returns are typically reviewed and processed within 3-5 business days. Please ensure the item is in its original packaging.
            </p>
          </div>

          {error && (
            <p style={{ color: "#d11a2a", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              background: "#111827",
              color: "#fff",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => !submitting && (e.target.style.background = "#1f2937")}
            onMouseLeave={(e) => !submitting && (e.target.style.background = "#111827")}
          >
            {submitting
              ? uploading
                ? "Uploading images..."
                : "Submitting..."
              : "Submit Return Request"}
          </button>

          {/* Cancel link */}
          <Link
            to="/orders"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: "1rem",
              color: "#6b7280",
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Cancel
          </Link>
        </form>
      </div>
    </div>
  );
};

export default RequestReturnPage;
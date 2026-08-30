import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";
import { formatPKR } from "../../utils/currency";
import { toastError } from "../../components/common/Toast";

const RETURN_REASONS = [
  "Item is defective/broken",
  "Wrong item received",
  "Item doesn't match description",
  "Missing parts or accessories",
  "No longer needed",
  "Other",
];

const RequestReturnPage = () => {
  const { sellerOrderId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryProductId = searchParams.get("productId");
  const navigate = useNavigate();

  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(queryProductId || null);
  const [returnQuantity, setReturnQuantity] = useState(1);

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axiosInstance.get(`/orders/seller-orders/${sellerOrderId}`);
        const data = res.data?.data || res.data;
        setOrderDetails(data);

        const items = data?.items || [];
        if (queryProductId) {
          setSelectedProductId(queryProductId);
          const found = items.find(
            (it) => (it.product?._id || it.product)?.toString() === queryProductId
          );
          if (found) setReturnQuantity(1);
        } else if (items.length === 1) {
          setSelectedProductId((items[0].product?._id || items[0].product)?.toString());
          setReturnQuantity(1);
        }
      } catch (err) {
        toastError("Unable to load order information.");
      } finally {
        setLoadingOrder(false);
      }
    };
    fetchOrder();
  }, [sellerOrderId, queryProductId]);

  const handleSelectProduct = (pId) => {
    setSelectedProductId(pId);
    setSearchParams({ productId: pId });
    setReturnQuantity(1);
    setError(null);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || e.dataTransfer.files || []);
    if (selectedFiles.length === 0) return;
    setFiles((prev) => [...prev, ...selectedFiles]);
    setPreviews((prev) => [
      ...prev,
      ...selectedFiles.map((f) => URL.createObjectURL(f)),
    ]);
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
    if (!selectedProductId) {
      setError("Please choose a product to return.");
      return;
    }
    if (!reason) {
      setError("Please select a return reason.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let imageUrls = [];
      if (files.length > 0) {
        setUploading(true);
        for (const file of files) {
          const formData = new FormData();
          formData.append("images", file);
          const { data } = await axiosInstance.post(
            "/returns/upload-image",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          const uploadedUrl = data.data?.url || data.url;
          if (uploadedUrl) imageUrls.push(uploadedUrl);
        }
        setUploading(false);
      }

      await axiosInstance.post("/returns", {
        sellerOrderId,
        productId: selectedProductId,
        quantity: returnQuantity,
        reason,
        description,
        images: imageUrls,
      });

      navigate("/returns");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to submit return request.";
      setError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOrder) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
        Loading order details…
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
        <p>Order details not found.</p>
        <Link to="/orders" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  const items = orderDetails.items || [];
  const storeName = orderDetails.store?.name || "Unknown Store";

  const selectedItem = items.find((it) => {
    const pId = (it.product?._id || it.product)?.toString();
    return pId === selectedProductId?.toString();
  });

  const purchasedQuantity = selectedItem?.quantity || 1;
  const unitPrice = selectedItem?.unitPriceSnapshot || 0;
  const estimatedRefund = unitPrice * returnQuantity;

  return (
    <div style={{ maxWidth: "680px", margin: "2rem auto", padding: "1.5rem" }}>
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
          gap: "6px",
        }}
      >
        ← Back
      </button>

      <div
        style={{
          background: "var(--surface)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "0 2px 8px var(--shadow)",
          padding: "2rem",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "var(--text-primary)",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.25rem" }}>
          Request a Return
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
          Order #{orderDetails._id.slice(0, 8).toUpperCase()} · Sold by <strong>{storeName}</strong>
        </p>

        {/* Multi-item selection when seller order has > 1 product */}
        {items.length > 1 && (
          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem" }}>
              Select which product you want to return:
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {items.map((item, idx) => {
                const pId = (item.product?._id || item.product)?.toString();
                const isSelected = selectedProductId === pId;
                const pImg = item.productImage || item.product?.images?.[0];

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectProduct(pId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: isSelected ? "var(--bg-secondary)" : "var(--surface)",
                      cursor: "pointer",
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
                        <img
                          src={getImageUrl(pImg)}
                          alt={item.productNameSnapshot}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
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
                        Purchased Qty: {item.quantity} · PKR {formatPKR(item.unitPriceSnapshot)}
                      </div>
                    </div>

                    <div>
                      {isSelected ? (
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

        {/* Selected Product Summary */}
        {selectedItem ? (
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "12px",
              padding: "1rem",
              marginBottom: "1.5rem",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
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
                flexShrink: 0,
                border: "1px solid var(--border)",
              }}
            >
              {selectedItem.product?.images?.[0] || selectedItem.productImage ? (
                <img
                  src={getImageUrl(selectedItem.product?.images?.[0] || selectedItem.productImage)}
                  alt={selectedItem.productNameSnapshot}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                  <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: 0, fontSize: "0.95rem" }}>{selectedItem.productNameSnapshot}</p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "2px 0 0" }}>
                Sold by {storeName} · Unit Price: PKR {formatPKR(unitPrice)}
              </p>
              <p style={{ fontWeight: 600, color: "var(--primary)", margin: "4px 0 0", fontSize: "0.9rem" }}>
                Est. Refund: PKR {formatPKR(estimatedRefund)}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ padding: "1.5rem", textAlign: "center", background: "var(--bg-secondary)", borderRadius: "12px", marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
            Please select an item above to initiate a return.
          </div>
        )}

        {selectedItem && (
          <form onSubmit={handleSubmit}>
            {/* Quantity Selector (when purchased > 1) */}
            {purchasedQuantity > 1 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  Quantity to Return (Max {purchasedQuantity})
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <select
                    className="form-input"
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(Number(e.target.value))}
                    style={{
                      width: "120px",
                      borderRadius: "8px",
                      padding: "0.6rem",
                      border: "1px solid var(--input-border)",
                      background: "var(--input-bg)",
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                    }}
                  >
                    {Array.from({ length: purchasedQuantity }, (_, i) => i + 1).map((qty) => (
                      <option key={qty} value={qty}>
                        {qty} {qty === 1 ? "unit" : "units"}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    out of {purchasedQuantity} purchased
                  </span>
                </div>
              </div>
            )}

            {/* Return Reason */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                Reason for Return *
              </label>
              <select
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "8px",
                  padding: "0.65rem",
                  border: "1px solid var(--input-border)",
                  background: "var(--input-bg)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                }}
              >
                <option value="">Select a reason</option>
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Details */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                Additional Details (optional)
              </label>
              <textarea
                className="form-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any extra information that might help the seller process your return..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  border: "1px solid var(--input-border)",
                  background: "var(--input-bg)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                  fontFamily: "Inter, system-ui, sans-serif",
                  outline: "none",
                }}
              />
            </div>

            {/* Attach Photos */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                Attach Photos (optional)
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--input-border)",
                  borderRadius: "8px",
                  padding: "2rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "var(--bg-secondary)",
                  transition: "border-color 0.2s",
                }}
              >
                <svg width="32" height="32" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ marginBottom: "0.5rem" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>
                  Click to upload or drag and drop photos
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
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
              {previews.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                  {previews.map((preview, idx) => (
                    <div key={idx} style={{ position: "relative", width: "80px", height: "80px" }}>
                      <img
                        src={preview}
                        alt={`Preview ${idx}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border)" }}
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          background: "var(--danger)",
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

            {error && (
              <div
                style={{
                  background: "var(--danger-bg)",
                  color: "var(--danger-text)",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  fontSize: "0.85rem",
                  border: "1px solid var(--danger)",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ background: "var(--info-bg)", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--info-text)", lineHeight: "1.5" }}>
              <p style={{ margin: 0 }}>
                Returns are reviewed and processed by the seller and platform admin. Please ensure the item is packaged safely.
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || uploading}
              style={{
                width: "100%",
                padding: "0.85rem",
                fontSize: "1rem",
                fontWeight: 600,
                borderRadius: "8px",
                border: "none",
                background: "var(--primary)",
                color: "var(--primary-contrast)",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
                transition: "background 0.2s",
              }}
            >
              {submitting ? (uploading ? "Uploading images..." : "Submitting...") : "Submit Return Request"}
            </button>

            <Link
              to="/orders"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "1rem",
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Cancel
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestReturnPage;
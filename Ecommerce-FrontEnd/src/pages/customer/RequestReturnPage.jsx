import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";

const RequestReturnPage = () => {
  const { sellerOrderId } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
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
        setOrderDetails(res.data?.data || res.data);
      } catch (err) { setError("Unable to load order information."); } finally { setLoadingOrder(false); }
    };
    fetchOrder();
  }, [sellerOrderId]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || e.dataTransfer.files);
    if (selectedFiles.length === 0) return;
    setFiles((prev) => [...prev, ...selectedFiles]);
    setPreviews((prev) => [...prev, ...selectedFiles.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
  };

  const handleDrop = (e) => { e.preventDefault(); handleFileSelect(e); };
  const handleDragOver = (e) => e.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) { setError("Please select a return reason."); return; }
    setSubmitting(true);
    setError(null);

    try {
      const productField = orderDetails?.items?.[0]?.product;
      const productId = productField?._id || productField;
      if (!productId) { setError("Could not identify product."); setSubmitting(false); return; }

      let imageUrls = [];
      if (files.length > 0) {
        setUploading(true);
        for (const file of files) {
          const formData = new FormData();
          formData.append("images", file);
          const { data } = await axiosInstance.post("/returns/upload-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
          const uploadedUrl = data.data?.url || data.url;
          if (uploadedUrl) imageUrls.push(uploadedUrl);
        }
        setUploading(false);
      }

      await axiosInstance.post("/returns", { sellerOrderId, productId, reason, description, images: imageUrls });
      navigate("/orders");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || "Failed to submit return request.");
    } finally { setSubmitting(false); }
  };

  const product = orderDetails?.items?.[0];
  const productName = product?.productNameSnapshot || "Product";
  const productImage = product?.product?.images?.[0];
  const storeName = orderDetails?.store?.name || "Unknown Store";
  const price = product ? (product.unitPriceSnapshot || 0) * (product.quantity || 1) : orderDetails?.subTotal || 0;
  const returnReasons = ["Item is defective/broken", "Wrong item received", "Item doesn't match description", "No longer needed", "Other"];

  if (loadingOrder) return <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>Loading…</div>;
  if (!orderDetails) return <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}><p>Order details not found.</p><Link to="/orders" style={{ color: "var(--text-primary)", fontWeight: 600 }}>Back to Orders</Link></div>;

  return (
    <div style={{ maxWidth: "640px", margin: "2rem auto", padding: "2rem" }}>
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.9rem", cursor: "pointer", marginBottom: "1.5rem", padding: 0 }}>← Back</button>

      <div style={{ background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 2px 8px var(--shadow)", padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>Request a Return</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Please fill out the details below to initiate your return.</p>

        <div style={{ background: "var(--bg-secondary)", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", background: "var(--surface-hover)", flexShrink: 0 }}>
            {productImage ? <img src={getImageUrl(productImage)} alt={productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}><svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
          </div>
          <div>
            <p style={{ fontWeight: 600, margin: 0 }}>{productName}</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "2px 0 0" }}>Sold by {storeName}</p>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "4px 0 0" }}>PKR {price.toLocaleString()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>Reason for Return</label>
            <select className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} required style={{ width: "100%", boxSizing: "border-box", borderRadius: "6px", padding: "0.6rem", border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "0.9rem" }}>
              <option value="">Select a reason</option>
              {returnReasons.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>Additional Details (optional)</label>
            <textarea className="form-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add any extra information that might help us process your return..." style={{ width: "100%", boxSizing: "border-box", borderRadius: "6px", padding: "0.75rem", border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "0.9rem", fontFamily: "Inter, system-ui, sans-serif", outline: "none" }} onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")} />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>Attach Photos (optional)</label>
            <div onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()} style={{ border: "2px dashed var(--input-border)", borderRadius: "8px", padding: "2rem", textAlign: "center", cursor: "pointer", background: "var(--bg-secondary)", transition: "border-color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--text-muted)")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--input-border)")}>
              <svg width="32" height="32" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ marginBottom: "0.5rem" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>Click to upload or drag and drop photos</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>PNG, JPG up to 5MB</p>
              <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".jpg,.jpeg,.png,.webp" multiple onChange={handleFileSelect} />
            </div>
            {previews.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                {previews.map((preview, idx) => (
                  <div key={idx} style={{ position: "relative", width: "80px", height: "80px" }}>
                    <img src={preview} alt={`Preview ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border)" }} />
                    <button type="button" onClick={() => removeFile(idx)} style={{ position: "absolute", top: "-6px", right: "-6px", background: "var(--danger)", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: "var(--info-bg)", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--info-text)", lineHeight: "1.5" }}>
            <p style={{ margin: 0 }}>Returns are typically reviewed and processed within 3-5 business days. Please ensure the item is in its original packaging.</p>
          </div>

          {error && <p style={{ color: "var(--danger)", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting} style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", fontWeight: 600, borderRadius: "8px", border: "none", background: "var(--primary)", color: "var(--primary-contrast)", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, transition: "background 0.2s" }} onMouseEnter={(e) => !submitting && (e.target.style.background = "var(--primary-hover)")} onMouseLeave={(e) => !submitting && (e.target.style.background = "var(--primary)")}>
            {submitting ? (uploading ? "Uploading images..." : "Submitting...") : "Submit Return Request"}
          </button>

          <Link to="/orders" style={{ display: "block", textAlign: "center", marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem", textDecoration: "none" }}>Cancel</Link>
        </form>
      </div>
    </div>
  );
};

export default RequestReturnPage;
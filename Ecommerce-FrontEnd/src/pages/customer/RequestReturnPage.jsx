import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

const RequestReturnPage = () => {
  const { orderItemId } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let imageUrls = [];
    if (files.length > 0) {
      setUploading(true);
      try {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          const res = await axiosInstance.post("/returns/upload-image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          imageUrls.push(res.data.imageUrl);
        }
      } catch (err) {
        setError("Failed to upload images. Please try again.");
        setSubmitting(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    try {
      await axiosInstance.post("/returns", {
        orderItemId,
        reason,
        description,
        imageUrls,
      });
      navigate("/returns/my");
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Failed to submit return request.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      <h2 className="section-title">Request Return</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Reason</label>
          <textarea
            className="form-input"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you want to return this item..."
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Additional Details (optional)</label>
          <textarea
            className="form-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Attach Photos (optional)</label>
          <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
          {previews.length > 0 && (
            <div className="image-gallery" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {previews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Preview ${idx + 1}`}
                  style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "0.25rem", border: "1px solid #eaeaea" }}
                />
              ))}
            </div>
          )}
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? (uploading ? "Uploading images..." : "Submitting...") : "Submit Return Request"}
        </button>
      </form>
    </div>
  );
};

export default RequestReturnPage;
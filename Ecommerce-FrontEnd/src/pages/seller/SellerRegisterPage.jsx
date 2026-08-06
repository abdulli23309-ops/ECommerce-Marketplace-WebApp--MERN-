import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

const SellerRegisterPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);          // null=loading, 'None'=no profile
  const [rejectionReason, setRejectionReason] = useState("");
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ businessName: "", description: "" });
  const [store, setStore] = useState({ name: "", description: "", logoFile: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  // 1. Check seller status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axiosInstance.get("/seller/status");
        const data = res.data?.data || res.data;
        if (!data.hasProfile) {
          setStatus("None");
        } else {
          setStatus(data.status);               // "Pending", "Approved", "Rejected"
          setRejectionReason(data.rejectionReason || "");
          if (data.status === "Approved") {
            navigate("/seller/products", { replace: true });
          }
        }
      } catch (err) {
        setError("Unable to load seller status.");
      }
    };
    fetchStatus();
  }, [navigate]);

  // 2. Handlers for the wizard
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axiosInstance.post("/seller/profile", profile);
      setStep(2);
    } catch (err) {
      setError("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", store.name);
      formData.append("description", store.description || "");
      if (store.logoFile) {
        formData.append("images", store.logoFile);   // field name must be "images"
      }

      await axiosInstance.post("/stores", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus("Pending");   // store saved, now awaiting approval
    } catch (err) {
      setError("Failed to create store. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStore({ ...store, logoFile: file });
    setLogoPreview(URL.createObjectURL(file));
  };

  // 3. Render based on status
  if (status === null) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>Loading...</div>;
  }

  // --- PENDING ---
  if (status === "Pending") {
    return (
      <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "2rem", textAlign: "center" }}>
        <h2 className="section-title">Application Submitted</h2>
        <p>Your seller application is under review. You'll be notified once it's processed.</p>
      </div>
    );
  }

  // --- REJECTED ---
  if (status === "Rejected") {
    return (
      <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "2rem" }}>
        <h2 className="section-title">Application Rejected</h2>
        <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: "0.5rem", padding: "1.5rem", marginTop: "1rem" }}>
          <p style={{ fontWeight: 600, color: "#000" }}>Reason:</p>
          <p style={{ color: "#666", marginBottom: "1rem" }}>{rejectionReason || "No reason provided."}</p>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>You can edit your details and re‑submit for approval.</p>
          <button className="btn-primary" onClick={() => { setStatus("None"); setStep(1); }}>Edit & Resubmit</button>
        </div>
      </div>
    );
  }

  // --- NO PROFILE (or after clicking "Edit & Resubmit") — show wizard ---
  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "2rem" }}>
      <h2 className="section-title">Become a Seller</h2>
      {step === 1 && (
        <form onSubmit={handleProfileSubmit}>
          <h3>Step 1: Business Profile</h3>
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input
              className="form-input"
              value={profile.businessName}
              onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-input"
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Next"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStoreSubmit}>
          <h3>Step 2: Your Store</h3>
          <div className="form-group">
            <label className="form-label">Store Name</label>
            <input
              className="form-input"
              value={store.name}
              onChange={(e) => setStore({ ...store, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Store Description (optional)</label>
            <textarea
              className="form-input"
              value={store.description}
              onChange={(e) => setStore({ ...store, description: e.target.value })}
            />
          </div>
          {/* Logo Upload */}
          <div className="form-group">
            <label className="form-label">Store Logo</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleLogoChange}
              style={{ marginBottom: "0.5rem" }}
            />
            {logoPreview && (
              <div style={{ marginTop: "0.5rem" }}>
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{ width: "100px", height: "100px", objectFit: "cover", border: "1px solid #eaeaea", borderRadius: "0.25rem" }}
                />
              </div>
            )}
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Submit for Review"}
          </button>
        </form>
      )}
    </div>
  );
};

export default SellerRegisterPage;
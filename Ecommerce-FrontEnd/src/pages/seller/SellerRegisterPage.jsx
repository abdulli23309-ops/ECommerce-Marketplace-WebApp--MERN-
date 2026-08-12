// SellerRegisterPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

const SellerRegisterPage = () => {
  const navigate = useNavigate();
  const [profileStatus, setProfileStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    businessName: "",
    description: "",
    phone: "",
    address: "",
    taxId: "",
  });
  const [store, setStore] = useState({
    name: "",
    description: "",
    city: "",
    logoFile: null,
    logoPreview: null,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axiosInstance.get("/seller/status");
        const data = res.data?.data || res.data;
        if (!data.hasProfile) {
          setProfileStatus("None");
          return;
        }
        setProfileStatus(data.status);
        setRejectionReason(data.rejectionReason || "");
        if (data.status === "Approved") {
          navigate("/seller/dashboard", { replace: true });
        }
      } catch (err) {
        setError("Unable to load seller status.");
      }
    };
    checkStatus();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("businessName", profile.businessName);
    formData.append("description", profile.description || "");
    formData.append("phone", profile.phone);
    formData.append("address", profile.address);
    formData.append("taxId", profile.taxId);
    formData.append("storeName", store.name);
    formData.append("storeDescription", store.description || "");
    formData.append("city", store.city);
    if (store.logoFile) {
      formData.append("images", store.logoFile);
    }

    try {
      await axiosInstance.post("/seller/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileStatus("Pending");
    } catch (err) {
      setError("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStore((prev) => ({
      ...prev,
      logoFile: file,
      logoPreview: URL.createObjectURL(file),
    }));
  };

  // ----- Rejected / Pending / Loading states unchanged -----
  if (profileStatus === null) {
    return <div style={styles.centeredMessage}><p style={{ color: "#6b7280" }}>Loading...</p></div>;
  }

  if (profileStatus === "Rejected") {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.iconRow}><div style={styles.iconCircleRed}>✕</div></div>
          <h2 style={styles.heading}>Application Rejected</h2>
          <p style={styles.subheading}>Unfortunately, your application was not approved.</p>
          <div style={styles.reasonBox}><strong>Reason:</strong> {rejectionReason || "No reason provided."}</div>
          <button style={styles.primaryButton} onClick={() => { setProfileStatus("None"); setStep(1); setProfile({ businessName: "", description: "", phone: "", address: "", taxId: "" }); setStore({ name: "", description: "", city: "", logoFile: null, logoPreview: null }); }}>Edit & Resubmit</button>
        </div>
      </div>
    );
  }

  if (profileStatus === "Pending") {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.iconRow}><div style={styles.iconCircleGreen}>✓</div></div>
          <h2 style={styles.heading}>Application Submitted</h2>
          <p style={styles.subheading}>Your seller application is now under review.</p>
          <p style={{ color: "#4b5563", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Once approved, you'll be able to manage your store and products.</p>
        </div>
      </div>
    );
  }

  // ----- Registration Form -----
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.progressBar}>
          <div style={step === 1 ? styles.progressStepActive : styles.progressStepDone} onClick={() => setStep(1)} style={{ cursor: "pointer" }}>
            <span style={styles.progressNumberActive}>1</span>
            <span style={styles.progressLabelActive}>Business Profile</span>
          </div>
          <div style={styles.progressLine} />
          <div style={step === 2 ? styles.progressStepActive : styles.progressStepInactive}>
            <span style={step === 2 ? styles.progressNumberActive : styles.progressNumberInactive}>2</span>
            <span style={step === 2 ? styles.progressLabelActive : styles.progressLabelInactive}>Store Details</span>
          </div>
        </div>

        <h2 style={styles.heading}>Become a Seller</h2>
        <p style={styles.subheading}>Fill in your business and store information. Your application will be reviewed by our team.</p>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Business Name *</label>
                <input style={styles.input} value={profile.businessName} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })} placeholder="e.g., Jadoon & Sons" required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Business Description</label>
                <textarea style={styles.textarea} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} placeholder="A short description about your business..." rows={4} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone *</label>
                <input style={styles.input} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+92 300 1234567" required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Address</label>
                <input style={styles.input} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Street address, city" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Tax ID</label>
                <input style={styles.input} value={profile.taxId} onChange={(e) => setProfile({ ...profile, taxId: e.target.value })} placeholder="NTN or tax registration number" />
              </div>
              <button type="button" style={styles.primaryButton} onClick={() => setStep(2)} disabled={!profile.businessName.trim() || !profile.phone.trim()}>
                Next: Store Details
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Store Name *</label>
                <input style={styles.input} value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} placeholder="e.g., Jadoon & Sons Electronics" required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Store Description</label>
                <textarea style={styles.textarea} value={store.description} onChange={(e) => setStore({ ...store, description: e.target.value })} placeholder="Tell customers about your store..." rows={3} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>City</label>
                <input style={styles.input} value={store.city} onChange={(e) => setStore({ ...store, city: e.target.value })} placeholder="e.g., Lahore, Karachi" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Store Logo</label>
                <div onClick={() => document.getElementById("logoFileInput").click()} style={styles.uploadZone}>
                  {store.logoPreview ? (
                    <img src={store.logoPreview} alt="Logo preview" style={styles.logoPreview} />
                  ) : (
                    <div style={{ color: "#6b7280" }}>
                      <div style={{ fontSize: "2rem" }}>+</div>
                      <div>Click to upload logo</div>
                    </div>
                  )}
                  <input id="logoFileInput" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleLogoChange} style={{ display: "none" }} />
                </div>
              </div>
              {error && <div style={styles.errorBox}>{error}</div>}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="button" style={{ ...styles.primaryButton, background: "#f3f4f6", color: "#374151" }} onClick={() => setStep(1)}>Back</button>
                <button type="submit" style={styles.primaryButton} disabled={loading || !store.name.trim()}>
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

// styles (same as before, no changes needed)
const styles = {
  wrapper: { maxWidth: "560px", margin: "2rem auto", padding: "0 1rem", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" },
  card: { background: "#fff", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", padding: "2.5rem 2rem" },
  progressBar: { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem", gap: "0.5rem" },
  progressStepActive: { display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#111827" },
  progressNumberActive: { width: "24px", height: "24px", borderRadius: "50%", background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700 },
  progressLabelActive: {},
  progressStepInactive: { display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500, fontSize: "0.85rem", color: "#9ca3af" },
  progressNumberInactive: { width: "24px", height: "24px", borderRadius: "50%", background: "#f3f4f6", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 600 },
  progressLabelInactive: {},
  progressStepDone: { display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#10b981", cursor: "pointer" },
  progressLine: { flex: 1, height: "2px", background: "#e5e7eb", maxWidth: "80px", margin: "0 0.25rem" },
  heading: { fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.5rem 0", textAlign: "center" },
  subheading: { color: "#6b7280", fontSize: "0.95rem", margin: "0 0 2rem 0", textAlign: "center", lineHeight: 1.5 },
  inputGroup: { marginBottom: "1.25rem" },
  label: { display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem", color: "#374151" },
  input: { width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.95rem", outline: "none", resize: "vertical", boxSizing: "border-box" },
  uploadZone: { border: "2px dashed #d1d5db", borderRadius: "8px", padding: "2rem", textAlign: "center", cursor: "pointer", background: "#f9fafb", marginTop: "0.25rem" },
  logoPreview: { width: "100px", height: "100px", objectFit: "cover", borderRadius: "0.5rem" },
  primaryButton: { padding: "0.75rem 1.5rem", borderRadius: "8px", background: "#111827", color: "#fff", fontWeight: 600, fontSize: "0.95rem", border: "none", cursor: "pointer", width: "100%" },
  errorBox: { background: "#fef2f2", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "1rem" },
  reasonBox: { background: "#f3f4f6", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem", color: "#374151" },
  iconRow: { display: "flex", justifyContent: "center", marginBottom: "1.5rem" },
  iconCircleGreen: { width: "48px", height: "48px", borderRadius: "50%", background: "#d1fae5", color: "#065f46", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700 },
  iconCircleRed: { width: "48px", height: "48px", borderRadius: "50%", background: "#fee2e2", color: "#991b1b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700 },
  centeredMessage: { padding: "3rem", textAlign: "center" },
};

export default SellerRegisterPage;
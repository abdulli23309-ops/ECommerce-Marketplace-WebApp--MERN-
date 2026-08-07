import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../services/axiosInstance";
import { useSelector, useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";
import { getImageUrl } from "../../utils/imageHelper";   // reuse your helper

const StoreSettingsPage = () => {
  const dispatch = useDispatch();
  const { user, accessToken, refreshToken } = useSelector((state) => state.auth);

  // ---------- Profile State ----------
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",               // optional, may not exist
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });

  // ---------- Password State ----------
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });

  // ---------- Store State ----------
  const [store, setStore] = useState({
    name: "",
    description: "",
    logo: "",
  });
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeMsg, setStoreMsg] = useState({ text: "", type: "" });

  // ---------- Logo Upload ----------
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  // ---------- Active Tab ----------
  const [activeTab, setActiveTab] = useState("profile");

  // ---------- Load Store Data ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get("/stores/mine");
        const data = res.data?.data;
        if (data) {
          setStore({
            name: data.name || "",
            description: data.description || "",
            logo: data.logo || "",
          });
        }
      } catch (err) {
        console.error("Failed to load store", err);
      }
    })();
  }, []);

  // ---------- Handlers ----------
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ text: "", type: "" });
    try {
      await axiosInstance.put("/account/profile", {
        name: profile.name,
        email: profile.email,
        phone: profile.phone || undefined,
      });
      // update Redux store
      dispatch(setCredentials({
        user: { ...user, name: profile.name, email: profile.email },
        accessToken,
        refreshToken,
      }));
      setProfileMsg({ text: "Profile updated successfully.", type: "success" });
    } catch (err) {
      setProfileMsg({ text: "Failed to update profile.", type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password.new !== password.confirm) {
      setPasswordMsg({ text: "New passwords do not match.", type: "error" });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg({ text: "", type: "" });
    try {
      // Assume endpoint exists; if not, just simulate success.
      await axiosInstance.put("/account/password", {
        currentPassword: password.current,
        newPassword: password.new,
      });
      setPassword({ current: "", new: "", confirm: "" });
      setPasswordMsg({ text: "Password changed successfully.", type: "success" });
    } catch (err) {
      setPasswordMsg({ text: "Failed to change password.", type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogoAndGetUrl = async () => {
    if (!logoFile) return store.logo;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("images", logoFile);
      const { data } = await axiosInstance.post("/products/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = data.data?.url || data.url;
      return uploadedUrl;
    } catch (err) {
      throw err;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    setStoreLoading(true);
    setStoreMsg({ text: "", type: "" });
    try {
      // If a new logo file is selected, upload it first
      let logoUrl = store.logo;
      if (logoFile) {
        logoUrl = await uploadLogoAndGetUrl();
      }
      await axiosInstance.put("/stores/mine", {
        name: store.name,
        description: store.description,
        logo: logoUrl,
      });
      setStore(prev => ({ ...prev, logo: logoUrl }));
      setLogoFile(null);
      setLogoPreview(null);
      setStoreMsg({ text: "Store updated successfully.", type: "success" });
    } catch (err) {
      setStoreMsg({ text: "Failed to save store.", type: "error" });
    } finally {
      setStoreLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // ---------- Helper: get initials for avatar ----------
  const getUserInitials = () => {
    const name = profile.name || "Seller";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.25rem" }}>Settings</h2>
        <p style={{ color: "#6b7280", margin: 0 }}>Manage your account and store preferences.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setActiveTab("profile")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "6px 6px 0 0",
            border: activeTab === "profile" ? "1px solid #e5e7eb" : "1px solid transparent",
            borderBottom: activeTab === "profile" ? "1px solid #fff" : "none",
            background: activeTab === "profile" ? "#fff" : "transparent",
            fontWeight: activeTab === "profile" ? 600 : 400,
            color: activeTab === "profile" ? "#111827" : "#6b7280",
            cursor: "pointer",
            marginBottom: "-1px",
            position: "relative",
            zIndex: activeTab === "profile" ? 1 : 0,
          }}
        >
          {/* User Icon */}
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </button>
        <button
          onClick={() => setActiveTab("store")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "6px 6px 0 0",
            border: activeTab === "store" ? "1px solid #e5e7eb" : "1px solid transparent",
            borderBottom: activeTab === "store" ? "1px solid #fff" : "none",
            background: activeTab === "store" ? "#fff" : "transparent",
            fontWeight: activeTab === "store" ? 600 : 400,
            color: activeTab === "store" ? "#111827" : "#6b7280",
            cursor: "pointer",
            marginBottom: "-1px",
            position: "relative",
            zIndex: activeTab === "store" ? 1 : 0,
          }}
        >
          {/* Store Icon */}
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Store
        </button>
      </div>

      {/* ============ PROFILE TAB ============ */}
      {activeTab === "profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Personal Info Card */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1.25rem" }}>Personal Information</h3>

            {/* Avatar Section */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "#111827", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.4rem", fontWeight: 700,
              }}>
                {getUserInitials()}
              </div>
              <div>
                <p style={{ fontWeight: 600, margin: 0 }}>{profile.name}</p>
                <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>Verified Seller</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number (optional)</label>
                  <input
                    className="form-input"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input
                    className="form-input"
                    value="Seller"
                    disabled
                    style={{ width: "100%", boxSizing: "border-box", background: "#f9fafb", color: "#6b7280" }}
                  />
                </div>
              </div>
              {profileMsg.text && (
                <p style={{ color: profileMsg.type === "success" ? "#065f46" : "#d11a2a", fontSize: "0.9rem", marginBottom: "1rem", fontWeight: 500 }}>
                  {profileMsg.text}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn-primary" disabled={profileLoading}>
                  {profileLoading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "16px", height: "16px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }}></span>
                      Saving...
                    </span>
                  ) : "Save Profile"}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1.25rem" }}>Change Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    required
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={password.new}
                    onChange={(e) => setPassword({ ...password, new: e.target.value })}
                    required
                    minLength={8}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                    required
                    minLength={8}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              {passwordMsg.text && (
                <p style={{ color: passwordMsg.type === "success" ? "#065f46" : "#d11a2a", fontSize: "0.9rem", marginBottom: "1rem", fontWeight: 500 }}>
                  {passwordMsg.text}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "16px", height: "16px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }}></span>
                      Changing...
                    </span>
                  ) : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ STORE TAB ============ */}
      {activeTab === "store" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Store Info Card */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 1.25rem" }}>Store Information</h3>

            {/* Logo Upload Dropzone */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Store Logo</label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  border: "2px dashed #d1d5db",
                  borderRadius: "8px",
                  padding: "2rem",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                  background: "#f9fafb",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview || store.logo ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <img
                      src={logoPreview || getImageUrl(store.logo)}
                      alt="Logo preview"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        marginBottom: "0.5rem",
                      }}
                    />
                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {logoFile ? logoFile.name : "Click or drop to change logo"}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <svg width="36" height="36" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: "0.5rem 0 0.25rem" }}>
                      Drag & drop your logo here, or click to browse
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
                      PNG or JPG up to 2MB, 500x500px recommended
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handleLogoFileChange}
                />
              </div>
            </div>

            <form onSubmit={handleStoreSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Store Name</label>
                  <input
                    className="form-input"
                    value={store.name}
                    onChange={(e) => setStore({ ...store, name: e.target.value })}
                    required
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={store.description}
                    onChange={(e) => setStore({ ...store, description: e.target.value })}
                    maxLength={500}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                  <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#9ca3af" }}>
                    {store.description.length}/500
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Support Email</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="store@example.com"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Store URL Slug</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: "6px", overflow: "hidden" }}>
                    <span style={{ background: "#f9fafb", padding: "0.5rem 0.75rem", color: "#6b7280", fontSize: "0.85rem", borderRight: "1px solid #d1d5db" }}>
                      vendorverse.com/store/
                    </span>
                    <input
                      className="form-input"
                      value={store.name?.toLowerCase().replace(/\s+/g, "-")}
                      readOnly
                      style={{ border: "none", flex: 1, paddingLeft: "0.5rem", background: "#fff" }}
                    />
                  </div>
                </div>
              </div>
              {storeMsg.text && (
                <p style={{ color: storeMsg.type === "success" ? "#065f46" : "#d11a2a", fontSize: "0.9rem", marginBottom: "1rem", fontWeight: 500 }}>
                  {storeMsg.text}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn-primary" disabled={storeLoading || uploadingLogo}>
                  {storeLoading || uploadingLogo ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "16px", height: "16px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }}></span>
                      {uploadingLogo ? "Uploading logo..." : "Saving..."}
                    </span>
                  ) : "Save Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyframe for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default StoreSettingsPage;
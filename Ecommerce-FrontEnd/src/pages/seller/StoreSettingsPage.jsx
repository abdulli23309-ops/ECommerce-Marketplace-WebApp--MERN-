import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../services/axiosInstance";
import { useSelector, useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";
import { getImageUrl } from "../../utils/imageHelper";

const StoreSettingsPage = () => {
  const dispatch = useDispatch();
  const { user, accessToken, refreshToken } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    taxId: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });

  const [store, setStore] = useState({
    name: "",
    description: "",
    logo: "",
    city: "",
  });
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeMsg, setStoreMsg] = useState({ text: "", type: "" });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    (async () => {
      try {
        const profileRes = await axiosInstance.get("/seller/profile");
        const profileData = profileRes.data?.data || profileRes.data;
        if (profileData) {
          setProfile({
            name: user?.name || "",
            email: user?.email || "",
            phone: profileData.phone || "",
            address: profileData.address || "",
            taxId: profileData.taxId || "",
          });
        }
      } catch (err) {
        console.error("Failed to load seller profile", err);
      }

      try {
        const storeRes = await axiosInstance.get("/stores/mine");
        const storeData = storeRes.data?.data;
        if (storeData) {
          setStore({
            name: storeData.name || "",
            description: storeData.description || "",
            logo: storeData.logo || "",
            city: storeData.city || "",
          });
        }
      } catch (err) {
        console.error("Failed to load store", err);
      }
    })();
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ text: "", type: "" });
    try {
      let avatarUrl = user?.avatar || null;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const { data } = await axiosInstance.put("/account/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        avatarUrl = data.data?.avatar || data.avatar;
        dispatch(setCredentials({
          user: { ...user, avatar: avatarUrl },
          accessToken,
          refreshToken,
        }));
        setAvatarFile(null);
        setAvatarPreview(null);
      }

      await axiosInstance.put("/seller/profile", {
        phone: profile.phone,
        address: profile.address,
        taxId: profile.taxId,
      });

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
      const { data } = await axiosInstance.post("/seller/products/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data?.url || data.url;
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
      let logoUrl = store.logo;
      if (logoFile) {
        logoUrl = await uploadLogoAndGetUrl();
      }
      await axiosInstance.put("/stores/mine", {
        name: store.name,
        description: store.description,
        logo: logoUrl,
        city: store.city,
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

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const getUserInitials = () => {
    const name = profile.name || "Seller";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "var(--text-primary)" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.25rem", color: "var(--text-primary)" }}>Settings</h2>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>Manage your account and store preferences.</p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        <button onClick={() => setActiveTab("profile")} style={{ ...tabStyle, ...(activeTab === "profile" ? tabActive : tabInactive) }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Profile
        </button>
        <button onClick={() => setActiveTab("store")} style={{ ...tabStyle, ...(activeTab === "store" ? tabActive : tabInactive) }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          Store
        </button>
      </div>

      {activeTab === "profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardStyle}>
            <h3 style={sectionHeader}>Personal Information</h3>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  width: "72px", height: "72px", borderRadius: "50%",
                  overflow: "hidden", cursor: "pointer", position: "relative",
                  border: "2px solid var(--border)", transition: "border-color 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--text-secondary)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
              >
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || getImageUrl(user.avatar)}
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--primary)", color: "var(--primary-contrast)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700 }}>
                    {getUserInitials()}
                  </div>
                )}
                <input
                  type="file"
                  ref={avatarInputRef}
                  style={{ display: "none" }}
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>{profile.name}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
                  Click the avatar to change your photo
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input className="form-input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+92 300 1234567" required style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Street address, city" style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax ID</label>
                  <input className="form-input" value={profile.taxId} onChange={(e) => setProfile({ ...profile, taxId: e.target.value })} placeholder="NTN or tax registration" style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input className="form-input" value="Seller" disabled style={{ width: "100%", boxSizing: "border-box", background: "var(--disabled-bg)", color: "var(--disabled-text)" }} />
                </div>
              </div>
              {profileMsg.text && <p style={{ color: profileMsg.type === "success" ? "var(--success-text)" : "var(--danger-text)", fontSize: "0.9rem", marginBottom: "1rem", fontWeight: 500 }}>{profileMsg.text}</p>}
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

          <div style={cardStyle}>
            <h3 style={sectionHeader}>Change Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input className="form-input" type="password" value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} required style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={password.new} onChange={(e) => setPassword({ ...password, new: e.target.value })} required minLength={8} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} required minLength={8} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>
              {passwordMsg.text && <p style={{ color: passwordMsg.type === "success" ? "var(--success-text)" : "var(--danger-text)", fontSize: "0.9rem", marginBottom: "1rem", fontWeight: 500 }}>{passwordMsg.text}</p>}
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

      {activeTab === "store" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardStyle}>
            <h3 style={sectionHeader}>Store Information</h3>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Store Logo</label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => logoInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--input-border)", borderRadius: "8px", padding: "2rem",
                  textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
                  background: "var(--bg-secondary)",
                }}
              >
                {logoPreview || store.logo ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <img src={logoPreview || getImageUrl(store.logo)} alt="Logo preview" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "0.5rem" }} />
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{logoFile ? logoFile.name : "Click or drop to change logo"}</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <svg width="36" height="36" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0.5rem 0 0.25rem" }}>Drag & drop your logo here, or click to browse</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>PNG or JPG up to 2MB, 500x500px recommended</p>
                  </div>
                )}
                <input type="file" ref={logoInputRef} style={{ display: "none" }} accept=".png,.jpg,.jpeg,.webp" onChange={handleLogoFileChange} />
              </div>
            </div>

            <form onSubmit={handleStoreSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Store Name</label>
                  <input className="form-input" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} required style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={4} value={store.description} onChange={(e) => setStore({ ...store, description: e.target.value })} maxLength={500} style={{ width: "100%", boxSizing: "border-box" }} />
                  <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)" }}>{store.description.length}/500</div>
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" value={store.city} onChange={(e) => setStore({ ...store, city: e.target.value })} placeholder="e.g., Lahore" style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Support Email</label>
                  <input className="form-input" type="email" placeholder="store@example.com" style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Store URL Slug</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--input-border)", borderRadius: "6px", overflow: "hidden" }}>
                    <span style={{ background: "var(--bg-secondary)", padding: "0.5rem 0.75rem", color: "var(--text-secondary)", fontSize: "0.85rem", borderRight: "1px solid var(--input-border)" }}>vendorverse.com/store/</span>
                    <input className="form-input" value={store.name?.toLowerCase().replace(/\s+/g, "-")} readOnly style={{ border: "none", flex: 1, paddingLeft: "0.5rem", background: "var(--input-bg)", color: "var(--text-primary)" }} />
                  </div>
                </div>
              </div>
              {storeMsg.text && <p style={{ color: storeMsg.type === "success" ? "var(--success-text)" : "var(--danger-text)", fontSize: "0.9rem", marginBottom: "1rem", fontWeight: 500 }}>{storeMsg.text}</p>}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const cardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const sectionHeader = {
  fontSize: "1.1rem",
  fontWeight: 600,
  margin: "0 0 1.25rem",
  color: "var(--text-primary)",
};

const tabStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem 1.25rem",
  borderRadius: "6px 6px 0 0",
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: "-1px",
  position: "relative",
  borderBottom: "none",
};

const tabActive = {
  border: "1px solid var(--border)",
  borderBottom: "1px solid var(--surface)",
  background: "var(--surface)",
  color: "var(--text-primary)",
  zIndex: 1,
};

const tabInactive = {
  border: "1px solid transparent",
  background: "transparent",
  color: "var(--text-secondary)",
  fontWeight: 400,
  zIndex: 0,
};

export default StoreSettingsPage;
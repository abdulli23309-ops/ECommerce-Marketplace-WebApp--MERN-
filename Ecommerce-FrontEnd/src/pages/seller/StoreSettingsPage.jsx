import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import { useSelector, useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";

const StoreSettingsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [fullName, setFullName] = useState(user?.name || user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });

  const [store, setStore] = useState({ name: "", description: "", logo: "" });
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeMsg, setStoreMsg] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("profile");

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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ text: "", type: "" });
    try {
      await axiosInstance.put("/account/profile", { name: fullName, email });
      dispatch(setCredentials({ user: { ...user, name: fullName, email }, accessToken: user.accessToken, refreshToken: user.refreshToken }));
      setProfileMsg({ text: "Profile updated.", type: "success" });
    } catch (err) {
      setProfileMsg({ text: "Network error.", type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    setStoreLoading(true);
    setStoreMsg({ text: "", type: "" });
    try {
      await axiosInstance.put("/stores/mine", {
        name: store.name,
        description: store.description,
        logo: store.logo,
      });
      setStoreMsg({ text: "Store updated.", type: "success" });
    } catch (err) {
      setStoreMsg({ text: "Failed to save store.", type: "error" });
    } finally {
      setStoreLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1.*$/, "") || "";
    return `${base}${url}`;
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem" }}>
      <h2 className="section-title">Settings</h2>
      <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem", borderBottom: "1px solid #eaeaea" }}>
        <button
          onClick={() => setActiveTab("profile")}
          style={{
            padding: "0.5rem 0",
            border: "none",
            background: "none",
            fontWeight: activeTab === "profile" ? 600 : 400,
            color: activeTab === "profile" ? "#000" : "#666",
            borderBottom: activeTab === "profile" ? "2px solid #000" : "2px solid transparent",
            cursor: "pointer",
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("store")}
          style={{
            padding: "0.5rem 0",
            border: "none",
            background: "none",
            fontWeight: activeTab === "store" ? 600 : 400,
            color: activeTab === "store" ? "#000" : "#666",
            borderBottom: activeTab === "store" ? "2px solid #000" : "2px solid transparent",
            cursor: "pointer",
          }}
        >
          Store
        </button>
      </div>

      {activeTab === "profile" && (
        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {profileMsg.text && <p style={{ color: profileMsg.type === "success" ? "#000" : "#d11a2a", marginBottom: "1rem", fontWeight: 500 }}>{profileMsg.text}</p>}
          <button type="submit" className="btn-primary" disabled={profileLoading}>{profileLoading ? "Saving..." : "Save Profile"}</button>
        </form>
      )}

      {activeTab === "store" && (
        <form onSubmit={handleStoreSubmit}>
          <div className="form-group">
            <label className="form-label">Store Name</label>
            <input className="form-input" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={4} value={store.description} onChange={(e) => setStore({ ...store, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Logo URL</label>
            <input className="form-input" value={store.logo} onChange={(e) => setStore({ ...store, logo: e.target.value })} />
          </div>
          {store.logo && (
            <img src={getImageUrl(store.logo)} alt="Logo" style={{ width: "120px", height: "120px", objectFit: "cover", border: "1px solid #eaeaea", borderRadius: "0.25rem", marginBottom: "1rem" }} />
          )}
          {storeMsg.text && <p style={{ color: storeMsg.type === "success" ? "#000" : "#d11a2a", marginBottom: "1rem", fontWeight: 500 }}>{storeMsg.text}</p>}
          <button type="submit" className="btn-primary" disabled={storeLoading}>{storeLoading ? "Saving..." : "Save Store"}</button>
        </form>
      )}
    </div>
  );
};

export default StoreSettingsPage;
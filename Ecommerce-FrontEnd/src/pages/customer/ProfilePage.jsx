import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { setCredentials, logout } from "../../store/authSlice";
import { fetchAddresses } from "../../services/addressService";
import axiosInstance from "../../services/axiosInstance";
import { getImageUrl } from "../../utils/imageHelper";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, accessToken, refreshToken } = useSelector((state) => state.auth);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchAddresses()
        .then((data) => setAddresses(data || []))
        .catch(console.error)
        .finally(() => setLoadingAddresses(false));
    }
  }, [user]);
  // Fetch full profile (including avatar) and update Redux if needed
useEffect(() => {
  if (!user) return;
  const fetchProfile = async () => {
    try {
      const { data } = await axiosInstance.get('/account/profile');
      const profile = data.data || data;
      // If the avatar in Redux is missing or different from the server, update it
      if (profile.avatar && profile.avatar !== user.avatar) {
        dispatch(
          setCredentials({
            user: { ...user, avatar: profile.avatar },
            accessToken,
            refreshToken,
          })
        );
      }
    } catch (err) {
      // ignore – the page still works without the avatar update
    }
  };
  fetchProfile();
}, [user?.id]); // re-run if user changes (e.g., login)

  // Upload avatar when a file is selected
  useEffect(() => {
    if (!avatarFile) return;
    const upload = async () => {
      setUploadingAvatar(true);
      try {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const { data } = await axiosInstance.put("/account/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const newAvatar = data.data?.avatar || data.avatar;
        dispatch(
          setCredentials({
            user: { ...user, avatar: newAvatar },
            accessToken,
            refreshToken,
          })
        );
        setMessage({ type: "success", text: "Profile picture updated." });
      } catch (err) {
        console.error("Avatar upload failed", err);
        setMessage({ type: "error", text: "Could not upload avatar." });
      } finally {
        setUploadingAvatar(false);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    };
    upload();
  }, [avatarFile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      // Send correct field names that match the backend model
      const { data } = await axiosInstance.put("/account/profile", {
        name,    // ← Mongoose field is 'name'
        email,
      });

      if (data.success) {
        // Update Redux user object with the new values
        dispatch(
          setCredentials({
            user: { ...user, name, email },
            accessToken,
            refreshToken,
          })
        );
        setMessage({ type: "success", text: "Profile updated!" });
        setEditing(false);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Update failed.",
        });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Network error. Please try again.";
      setMessage({ type: "error", text: msg });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const getUserInitials = () => {
    const nameStr = user?.name || "User";
    return nameStr
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>
        Please log in to view your profile.
      </div>
    );
  }

  const isSeller = user.roles?.includes("Seller");
  const isAdmin = user.roles?.includes("SuperAdmin") || user.roles?.includes("Admin");

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2.5rem 0" }}>
      <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ------------------- Profile Header Card ------------------- */}
        <div style={{
          background: "#fff", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          border: "1px solid #f3f4f6", padding: "2rem", display: "flex",
          flexWrap: "wrap", alignItems: "center", gap: "1.5rem",
        }}>
          {/* Avatar – clickable to upload */}
          <div
            onClick={handleAvatarClick}
            style={{
              position: "relative",
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              cursor: "pointer",
              overflow: "hidden",
              flexShrink: 0,
              background: user?.avatar
                ? "none"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
          >
            {user?.avatar || avatarPreview ? (
              <img
                src={avatarPreview || getImageUrl(user.avatar)}
                alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "1.8rem", fontWeight: 700,
              }}>
                {getUserInitials()}
              </div>
            )}
            {/* Upload overlay */}
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 0.2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
            >
              <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
            />
          </div>

          {/* Info / Edit Form */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <input
                  className="form-input"
                  style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "1rem" }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                />
                <input
                  className="form-input"
                  type="email"
                  style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "1rem" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    onClick={handleSave}
                    style={{
                      padding: "0.5rem 1.25rem", borderRadius: "6px", border: "none",
                      background: "#111827", color: "#fff", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    style={{
                      padding: "0.5rem 1.25rem", borderRadius: "6px", border: "1px solid #d1d5db",
                      background: "#fff", color: "#374151", fontWeight: 500, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.25rem" }}>
                  {user.name || "User"}
                </h2>
                <p style={{ color: "#6b7280", margin: "0 0 0.5rem", fontSize: "0.95rem" }}>
                  {user.email}
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {user.roles?.map((role) => (
                    <span
                      key={role}
                      style={{
                        background: "#eff6ff",
                        color: "#1e40af",
                        padding: "2px 10px",
                        borderRadius: "999px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {message && (
              <p style={{
                marginTop: "0.75rem", fontSize: "0.9rem", fontWeight: 500,
                color: message.type === "success" ? "#065f46" : "#d11a2a",
              }}>
                {message.text}
              </p>
            )}
          </div>

          {/* Edit Profile button (only when not editing) */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                background: "transparent", border: "1px solid #d1d5db", borderRadius: "6px",
                padding: "0.5rem 1.25rem", fontSize: "0.9rem", fontWeight: 500,
                color: "#374151", cursor: "pointer", transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#f3f4f6")}
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* ------------------- Saved Addresses ------------------- */}
        <div style={{
          background: "#fff", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          border: "1px solid #f3f4f6", padding: "2rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Saved Addresses</h3>
            <Link
              to="/addresses"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.25rem",
                color: "#4b5563", fontSize: "0.9rem", fontWeight: 500, textDecoration: "none",
              }}
            >
              Manage
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loadingAddresses ? (
            <p style={{ color: "#6b7280" }}>Loading addresses…</p>
          ) : addresses.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No addresses saved yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1rem",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                >
                  <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>{addr.fullName}</p>
                  <p style={{ color: "#4b5563", fontSize: "0.9rem", margin: "0 0 0.5rem", lineHeight: 1.5 }}>
                    {addr.addressLine1}, {addr.city}
                  </p>
                  {addr.isDefault && (
                    <span style={{
                      display: "inline-block", background: "#dcfce7", color: "#166534",
                      padding: "1px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600,
                    }}>
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ------------------- Promotional Banner (Become a Seller) ------------------- */}
        {!isSeller && (
          <div style={{
            background: "linear-gradient(135deg, #f3e8ff, #e0e7ff)",
            borderRadius: "16px", padding: "2rem", textAlign: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#111827" }}>
              Ready to start your own business?
            </h3>
            <p style={{ color: "#4b5563", margin: "0 0 1.25rem", fontSize: "0.95rem" }}>
              Create your own store and start selling to thousands of customers.
            </p>
            <Link
              to="/seller/register"
              style={{
                display: "inline-block", padding: "0.75rem 2rem", borderRadius: "8px",
                background: "#111827", color: "#fff", fontWeight: 600, textDecoration: "none",
                transition: "background 0.2s", fontSize: "1rem",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#1f2937")}
              onMouseLeave={(e) => (e.target.style.background = "#111827")}
            >
              Become a Seller
            </Link>
          </div>
        )}

        {/* ------------------- Dashboard Links & Logout ------------------- */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center",
          justifyContent: "flex-end",
        }}>
          {isSeller && (
            <Link
              to="/seller/dashboard"
              style={{
                padding: "0.5rem 1.25rem", borderRadius: "6px", border: "1px solid #d1d5db",
                color: "#374151", fontWeight: 500, textDecoration: "none", background: "#fff",
                fontSize: "0.9rem",
              }}
            >
              Go to Seller Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              style={{
                padding: "0.5rem 1.25rem", borderRadius: "6px", border: "1px solid #d1d5db",
                color: "#374151", fontWeight: 500, textDecoration: "none", background: "#fff",
                fontSize: "0.9rem",
              }}
            >
              Go to Admin Dashboard
            </Link>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.5rem 1.25rem", borderRadius: "6px", border: "1px solid transparent",
              background: "#fff", color: "#dc2626", fontWeight: 500, cursor: "pointer",
              fontSize: "0.9rem", transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#fef2f2";
              e.target.style.borderColor = "#fecaca";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#fff";
              e.target.style.borderColor = "transparent";
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
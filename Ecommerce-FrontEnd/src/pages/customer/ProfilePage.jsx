import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { setCredentials, logout } from "../../store/authSlice";
import { updateProfile } from "../../services/authService";
import { fetchAddresses } from "../../services/addressService";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState(null);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    if (user) {
      fetchAddresses()
        .then(data => setAddresses(data || []))
        .catch(console.error);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const result = await updateProfile(fullName, email);
      if (result.succeeded) {
        dispatch(setCredentials({
          ...user,
          user: { ...user, fullName, email },
          accessToken: user.accessToken, // keep existing token
          refreshToken: user.refreshToken
        }));
        setMessage({ type: "success", text: "Profile updated!" });
        setEditing(false);
      } else {
        setMessage({ type: "error", text: result.message || "Update failed." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error." });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (!user) {
    return <div style={{ padding: "3rem", color: "#666" }}>Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            {user.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <h2 className="profile-name">{user.fullName}</h2>
            <p className="profile-email">{user.email}</p>
            <div className="profile-roles">
              {user.roles?.map(role => (
                <span key={role} className="role-tag">{role}</span>
              ))}
            </div>
          </div>
          <button className="btn-edit-profile" onClick={() => setEditing(!editing)}>
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* Edit Profile Form (inline) */}
        {editing && (
          <div className="edit-profile-form">
            <h3>Edit Your Details</h3>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={handleSave}>Save Changes</button>
            {message && (
              <p className={`message ${message.type}`}>{message.text}</p>
            )}
          </div>
        )}

        {/* Addresses Section */}
        <div className="profile-section">
          <h3 className="section-title">Saved Addresses</h3>
          {addresses.length === 0 ? (
            <p style={{ color: "#666" }}>No addresses saved yet.</p>
          ) : (
            <div className="address-list">
              {addresses.map(addr => (
                <div key={addr.id} className="address-item">
                  <span className="address-fullname">{addr.fullName}</span>
                  <span className="address-detail">{addr.addressLine1}, {addr.city}</span>
                  {addr.isDefault && <span className="default-badge">Default</span>}
                </div>
              ))}
            </div>
          )}
          <Link to="/addresses" className="btn-manage">Manage Addresses</Link>
        </div>

        {/* Dashboard Access & Logout */}
        <div className="profile-actions">
          {user.roles?.includes("Seller") && (
            <Link to="/seller/dashboard" className="btn-dashboard">Go to Seller Dashboard</Link>
          )}
          {user.roles?.includes("SuperAdmin") && (
            <Link to="/admin/dashboard" className="btn-dashboard">Go to Admin Dashboard</Link>
          )}
          {!user.roles?.includes("Seller") && (
            <Link to="/seller/register" className="btn-dashboard">Become a Seller</Link>
          )}
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
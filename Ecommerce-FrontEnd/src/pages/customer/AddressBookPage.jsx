import { useState, useEffect } from "react";
import {
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../services/addressService";

const MapPin = ({ size = 64, color = "var(--text-muted)" }) => (
  <svg style={{ width: size, height: size, color, display: "block", margin: "0 auto 16px auto" }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const Plus = ({ size = 20, color = "currentColor" }) => (
  <svg style={{ width: size, height: size, verticalAlign: "middle" }} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const Edit = ({ size = 16, color = "currentColor" }) => (
  <svg style={{ width: size, height: size, marginRight: 4 }} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const Trash = ({ size = 16, color = "currentColor" }) => (
  <svg style={{ width: size, height: size, marginRight: 4 }} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const Check = ({ size = 16, color = "currentColor" }) => (
  <svg style={{ width: size, height: size, marginRight: 4 }} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const pageStyle = { backgroundColor: "var(--bg-secondary)", minHeight: "100vh", padding: "40px 20px", fontFamily: "Arial, sans-serif" };
const containerStyle = { margin: "0 auto", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "32px" };
const cardStyle = { backgroundColor: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", padding: "32px", boxShadow: "0 1px 3px var(--shadow)" };
const titleStyle = { fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 };
const btnPrimaryStyle = { backgroundColor: "var(--primary)", color: "var(--primary-contrast)", padding: "8px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "6px" };
const btnSecondaryStyle = { backgroundColor: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", padding: "6px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "4px" };
const inputStyle = { width: "100%", padding: "10px 0", border: "none", borderBottom: "1px solid var(--border)", outline: "none", backgroundColor: "transparent", fontSize: "0.9rem", color: "var(--text-primary)" };
const labelStyle = { fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "4px", display: "block" };
const flexRow = { display: "flex", gap: "24px" };
const badgeStyle = { position: "absolute", top: "16px", right: "16px", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500 };

const COUNTRY_OPTIONS = [
  "Pakistan",
  "Saudi Arabia",
  "USA",
  "UK",
  "Iraq",
];

const AddressBookPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Pakistan",
    isDefault: false,
  });

  const load = async () => {
    try {
      const data = await fetchAddresses();
      setAddresses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({
      fullName: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Pakistan",
      isDefault: false,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAddress(editingId, form);
      } else {
        await addAddress(form);
      }
      resetForm();
      load();
    } catch (err) {
      console.error("Failed to save address", err);
    }
  };

  const handleEdit = (addr) => {
    setForm({
      fullName: addr.fullName,
      phoneNumber: addr.phoneNumber,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "Pakistan",
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    await deleteAddress(id);
    load();
  };

  const handleSetDefault = async (id) => {
    await setDefaultAddress(id);
    load();
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: "center", color: "var(--text-secondary)", paddingTop: "80px" }}>
          Loading addresses...
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={titleStyle}>Your Addresses</h2>
          {!showForm && (
            <button style={btnPrimaryStyle} onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus size={16} color="#fff" />
              Add Address
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={cardStyle}>
            <h3 style={{ fontWeight: 600, margin: "0 0 24px 0", fontSize: "1.1rem", color: "var(--text-primary)" }}>
              {editingId ? "Edit Address" : "New Address"}
            </h3>

            <div style={flexRow}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  style={inputStyle}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Phone Number</label>
                <input
                  style={inputStyle}
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <label style={labelStyle}>Address Line 1</label>
              <input
                style={inputStyle}
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                required
              />
            </div>

            <div style={{ marginTop: "16px" }}>
              <label style={labelStyle}>Address Line 2 (optional)</label>
              <input
                style={inputStyle}
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
              />
            </div>

            <div style={{ ...flexRow, marginTop: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>City</label>
                <input
                  style={inputStyle}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>State</label>
                <input
                  style={inputStyle}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Postal Code</label>
                <input
                  style={inputStyle}
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <label style={labelStyle}>Country</label>
              <select
                style={{ ...inputStyle, borderBottom: "1px solid var(--border)" }}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                required
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                style={{ accentColor: "var(--primary)" }}
              />
              <label style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>
                Set as default address
              </label>
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
              <button type="submit" style={btnPrimaryStyle}>
                {editingId ? "Update" : "Save"}
              </button>
              <button type="button" style={btnSecondaryStyle} onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {!showForm && addresses.length === 0 && (
          <div style={{ ...cardStyle, textAlign: "center", padding: "48px" }}>
            <MapPin size={64} color="var(--text-muted)" />
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>No addresses saved yet.</p>
            <button style={btnPrimaryStyle} onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus size={16} color="#fff" />
              Add New Address
            </button>
          </div>
        )}

        {!showForm && addresses.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {addresses.map((addr) => (
              <div
                key={addr.id}
                style={{
                  width: "calc(50% - 8px)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "20px",
                  position: "relative",
                  backgroundColor: "var(--surface-elevated)",
                  boxSizing: "border-box",
                }}
              >
                {addr.isDefault && <span style={badgeStyle}>Default</span>}
                <p style={{ fontWeight: 500, fontSize: "1rem", color: "var(--text-primary)", margin: "0 0 8px" }}>
                  {addr.fullName}
                </p>
                <p style={{ color: "var(--text-secondary)", margin: "0 0 4px", fontSize: "0.9rem" }}>
                  {addr.phoneNumber}
                </p>
                <p style={{ color: "var(--text-secondary)", margin: "0 0 4px", fontSize: "0.9rem" }}>
                  {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                </p>
                <p style={{ color: "var(--text-secondary)", margin: "0 0 4px", fontSize: "0.9rem" }}>
                  {addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postalCode}
                </p>
                <p style={{ color: "var(--text-secondary)", margin: "0 0 4px", fontSize: "0.9rem" }}>
                  {addr.country || "Pakistan"}
                </p>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button
                    style={{ ...btnSecondaryStyle, padding: "4px 12px", fontSize: "0.8rem" }}
                    onClick={() => handleEdit(addr)}
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    style={{ ...btnSecondaryStyle, padding: "4px 12px", fontSize: "0.8rem" }}
                    onClick={() => handleDelete(addr.id)}
                  >
                    <Trash size={14} />
                    Delete
                  </button>
                  {!addr.isDefault && (
                    <button
                      style={{ ...btnSecondaryStyle, padding: "4px 12px", fontSize: "0.8rem", borderColor: "var(--border)" }}
                      onClick={() => handleSetDefault(addr.id)}
                    >
                      <Check size={14} />
                      Set Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressBookPage;
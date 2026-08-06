import { useState, useEffect } from "react";
import {
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../services/addressService";

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

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({
      fullName: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
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

  if (loading) return <div style={{ padding: "2rem", color: "#666" }}>Loading addresses...</div>;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "3rem 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="section-title">Your Addresses</h2>
        <button className="btn-primary" style={{ width: "auto", padding: "0.5rem 1.5rem" }} onClick={() => { resetForm(); setShowForm(true); }}>
          Add Address
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: "0.5rem", padding: "1.5rem", marginBottom: "2rem" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>{editingId ? "Edit Address" : "New Address"}</h3>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Address Line 1</label>
            <input className="form-input" value={form.addressLine1} onChange={e => setForm({...form, addressLine1: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Address Line 2 (optional)</label>
            <input className="form-input" value={form.addressLine2} onChange={e => setForm({...form, addressLine2: e.target.value})} />
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">State (optional)</label>
              <input className="form-input" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Postal Code (optional)</label>
              <input className="form-input" value={form.postalCode} onChange={e => setForm({...form, postalCode: e.target.value})} />
            </div>
          </div>
          <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} />
            <label className="form-label" style={{ marginBottom: 0 }}>Set as default address</label>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="submit" className="btn-primary" style={{ width: "auto" }}>{editingId ? "Update" : "Save"}</button>
            <button type="button" className="btn-edit-profile" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <p style={{ color: "#666" }}>No addresses saved yet.</p>
      ) : (
        <div className="address-list">
          {addresses.map(addr => (
            <div key={addr.id} className="address-card">
              <div className="address-info">
                <p className="address-fullname">{addr.fullName}</p>
                <p className="address-detail">{addr.phoneNumber}</p>
                <p className="address-detail">
                  {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}<br />
                  {addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postalCode}
                </p>
                {addr.isDefault && <span className="default-badge">Default</span>}
              </div>
              <div className="address-actions">
                <button className="btn-edit" onClick={() => handleEdit(addr)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(addr.id)}>Delete</button>
                {!addr.isDefault && (
                  <button className="btn-set-default" onClick={() => handleSetDefault(addr.id)}>Set Default</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressBookPage;
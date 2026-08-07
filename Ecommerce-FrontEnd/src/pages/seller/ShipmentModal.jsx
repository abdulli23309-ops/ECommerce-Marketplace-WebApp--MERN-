import { useState, useEffect } from "react";
import { createShipment, updateShipmentStatus } from "../../services/sellerShipmentService";

const carrierOptions = ["DHL", "FedEx", "TCS", "Leopard", "BlueEx", "Pakistan Post", "Other"];

const ShipmentModal = ({ sellerOrderId, parentOrderId, shipment, onClose, onSaved }) => {
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Pre‑fill when shipment exists
  useEffect(() => {
    if (shipment) {
      setCarrier(shipment.carrier || "");
      setTrackingNumber(shipment.trackingNumber || "");
      setStatus(shipment.status || "");
    } else {
      setCarrier("");
      setTrackingNumber("");
      setStatus("");
    }
  }, [shipment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (!shipment) {
        // Create new shipment
        const newShipment = await createShipment(sellerOrderId, trackingNumber, carrier);
        onSaved(newShipment);
        onClose(); // close after creation – user can reopen to update status
      } else {
        // Update shipment status only (carrier/tracking are locked)
        if (status !== shipment.status) {
          const updated = await updateShipmentStatus(shipment._id, status, "");
          onSaved(updated);
        }
        onClose();
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to save shipment.");
    } finally {
      setLoading(false);
    }
  };

  const isDelivered = shipment?.status === "Delivered";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 999,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "500px",
          maxWidth: "90vw",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          zIndex: 1000,
          padding: "2rem",
          boxSizing: "border-box",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#111827",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
            Shipment for Order #{parentOrderId}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        {shipment && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "0.75rem",
              background: "#f9fafb",
              borderRadius: "6px",
            }}
          >
            <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>
              Current Status: {shipment.status}
            </p>
            {shipment.trackingHistory?.length > 0 && (
              <div>
                <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0 0 0.25rem" }}>
                  Tracking History:
                </p>
                {shipment.trackingHistory.map((th, i) => (
                  <div key={i} style={{ fontSize: "0.8rem", color: "#374151" }}>
                    {th.status} {th.note && `– ${th.note}`} –{" "}
                    {new Date(th.timestamp).toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!shipment && (
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
            No shipment created yet. Fill in the details below.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Carrier */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "0.25rem",
                fontSize: "0.9rem",
              }}
            >
              Carrier
            </label>
            <select
              className="form-input"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              disabled={!!shipment} // locked once created
              style={{ width: "100%" }}
            >
              <option value="">Select carrier</option>
              {carrierOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tracking Number */}
          <div style={{ marginBottom: shipment ? "1rem" : "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "0.25rem",
                fontSize: "0.9rem",
              }}
            >
              Tracking Number
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              disabled={!!shipment} // locked once created
              style={{ width: "100%" }}
            />
          </div>

          {/* Status update dropdown – only when shipment exists */}
          {shipment && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                  fontSize: "0.9rem",
                }}
              >
                Update Status
              </label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isDelivered}
                style={{ width: "100%" }}
              >
                <option value="">Select status</option>
                <option value="Pending">Pending</option>
                <option value="Packed">Packed</option>
                <option value="Dispatched">Dispatched</option>
                <option value="OutForDelivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          )}

          {message && (
            <p
              style={{
                color: message.includes("Failed") ? "#d11a2a" : "#000",
                fontSize: "0.85rem",
                marginBottom: "1rem",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || (!shipment && (!carrier || !trackingNumber))}
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem" }}
          >
            {loading
              ? "Saving..."
              : shipment
              ? isDelivered
                ? "No changes allowed"
                : "Update Shipment"
              : "Create Shipment"}
          </button>
        </form>
      </div>
    </>
  );
};

export default ShipmentModal;
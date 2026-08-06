import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { fetchCart } from "../../services/cartService";
import { fetchAddresses } from "../../services/addressService";
import { placeOrder } from "../../services/orderService";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        const [cartData, addressData] = await Promise.all([
          fetchCart(),
          fetchAddresses(),
        ]);
        setCart(cartData);
        setAddresses(addressData);
        // Auto‑select default address
        const defaultAddr = addressData.find((a) => a.isDefault);
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        else if (addressData.length > 0) setSelectedAddressId(addressData[0].id);
      } catch (err) {
        console.error("Failed to load checkout data", err);
        setError("Could not load cart or addresses.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  const calculateTotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select a delivery address.");
      return;
    }

    setPlacing(true);
    setError(null);

    try {
      await placeOrder(selectedAddressId);
      navigate("/orders"); // redirect to order history
    } catch (err) {
      console.error("Failed to place order", err);
      setError("Order could not be placed. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "3rem", color: "#666" }}>Loading checkout...</div>;
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>
        Your cart is empty. <a href="/cart" style={{ color: "#000" }}>Go to Cart</a>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-main">
        <h2 className="section-title">Select Delivery Address</h2>
        <div className="address-list">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`address-item ${selectedAddressId === addr.id ? "selected" : ""}`}
              onClick={() => setSelectedAddressId(addr.id)}
            >
              <input
                type="radio"
                className="address-radio"
                checked={selectedAddressId === addr.id}
                onChange={() => setSelectedAddressId(addr.id)}
              />
              <div className="address-content">
                <p className="address-fullname">{addr.fullName}</p>
                <p className="address-detail">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}, {addr.city}
                  {addr.state ? `, ${addr.state}` : ""} {addr.postalCode || ""}
                </p>
                <p className="address-detail" style={{ marginTop: "0.25rem" }}>
                  Phone: {addr.phoneNumber}
                </p>
              </div>
              {addr.isDefault && (
                <span style={{ fontSize: "0.75rem", color: "#666" }}>Default</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="checkout-sidebar">
        <div className="order-summary">
          <h3>Order Summary</h3>
          {cart.items.map((item) => (
            <div key={item.cartItemId} className="summary-row">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>PKR {(item.unitPrice * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="summary-row total">
            <span>Total</span>
            <span>PKR {calculateTotal().toLocaleString()}</span>
          </div>

          {error && (
            <p style={{ color: "#d11a2a", fontSize: "0.875rem", marginTop: "1rem" }}>
              {error}
            </p>
          )}

          <button
            className="btn-place-order"
            onClick={handlePlaceOrder}
            disabled={placing || !selectedAddressId}
          >
            {placing ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
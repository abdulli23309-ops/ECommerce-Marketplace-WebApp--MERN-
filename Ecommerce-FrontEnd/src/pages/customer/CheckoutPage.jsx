import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { fetchCart } from "../../services/cartService";
import { fetchAddresses } from "../../services/addressService";
import { createPaymentIntent } from "../../services/orderService";
import { getImageUrl } from "../../utils/imageHelper";
import { emptyCart } from "../../store/cartSlice";

// ---------- Simple inline SVG icons (sizes fixed) ----------
const CreditCard = () => (
  <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const Truck = () => (
  <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const MapPin = () => (
  <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const Plus = () => (
  <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const CheckCircle2 = () => (
  <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const Lock = () => (
  <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const ShoppingBag = () => (
  <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

// Common styles
const pageBg = { minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', fontFamily: 'Arial, sans-serif' };
const container = { maxWidth: '1200px', margin: '0 auto', padding: '40px 16px' };
const twoCol = { display: 'flex', gap: '32px', flexWrap: 'wrap' };
const leftCol = { flex: '2', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' };
const rightCol = { flex: '1', minWidth: '280px' };
const card = { backgroundColor: 'var(--surface)', borderRadius: '16px', boxShadow: '0 1px 3px var(--shadow)', border: '1px solid var(--border)', padding: '24px' };
const sectionTitle = { fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' };
const btnPrimary = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' };
const btnGhost = { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' };
const inputRadio = { accentColor: '#4f46e5', marginRight: '12px' };
const orderSummaryItem = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' };

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const mode = useSelector((state) => state.theme.mode);
  const stripe = useStripe();
  const elements = useElements();

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  // Stripe Elements are rendered in an iframe and cannot consume CSS custom properties.
  const cardElementOptions = {
    style: {
      base: { fontSize: "16px", color: mode === "dark" ? "#f3f4f6" : "#424770", "::placeholder": { color: mode === "dark" ? "#71717a" : "#aab7c4" } },
      invalid: { color: "#f87171" },
    },
  };

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
      if (paymentMethod === "card") {
        if (!stripe || !elements) {
          setError("Stripe is still loading. Please try again.");
          setPlacing(false);
          return;
        }

        // Create payment intent and get client secret
        const result = await createPaymentIntent(selectedAddressId, "Stripe");
        const { clientSecret, order } = result;

        // Stripe confirmCardPayment with return_url for 3DS
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
            },
            return_url: `${window.location.origin}/order-confirmation/${order._id}`,
          }
        );

        if (stripeError) {
          setError(stripeError.message);
          setPlacing(false);
          return;
        }

        // If no redirect (no 3DS), go directly to confirmation
        if (paymentIntent.status === "succeeded") {
          dispatch(emptyCart());
          navigate(`/order-confirmation/${order._id}?payment_intent=${paymentIntent.id}`);
        } else {
          // For requires_action or processing, Stripe will redirect automatically
          // Do nothing – the return_url will handle the redirect
        }
      } else {
        // Cash on Delivery
        const result = await createPaymentIntent(selectedAddressId, "CashOnDelivery");
        dispatch(emptyCart());
        navigate(`/order-confirmation/${result.order._id}`);
      }
    } catch (err) {
      console.error("Failed to place order", err);
      setError("Order could not be placed. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ ...pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', animation: 'pulse 1.5s infinite' }}>Loading checkout...</div>
      </div>
    );
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <div style={{ ...pageBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
        <ShoppingBag />
        <p style={{ fontSize: '1.125rem' }}>Your cart is empty.</p>
        <button
          onClick={() => navigate("/cart")}
          style={{ marginTop: '16px', background: 'none', border: 'none', color: '#111827', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Go to Cart
        </button>
      </div>
    );
  }

  return (
    <div style={pageBg}>
      <div style={container}>
        <div style={twoCol}>
          {/* Left Column */}
          <div style={leftCol}>
            {/* Delivery Address */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={sectionTitle}>
                  <MapPin /> Delivery Address
                </h2>
                <button style={btnGhost} onClick={() => navigate("/addresses")}>
                  <Plus /> Add New
                </button>
              </div>

              {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', border: '2px dashed #d1d5db', borderRadius: '8px' }}>
                  <p style={{ color: '#6b7280', marginBottom: '12px' }}>No saved addresses yet.</p>
                  <button style={btnPrimary} onClick={() => navigate("/addresses")}>
                    <Plus /> Add an Address
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '8px',
                        border: selectedAddressId === addr.id ? '2px solid #4f46e5' : '1px solid #ddd',
                        backgroundColor: selectedAddressId === addr.id ? '#eef2ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name="address"
                        style={inputRadio}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 500, color: '#111827' }}>{addr.fullName}</p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '2px' }}>
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}, {addr.city}
                          {addr.state ? `, ${addr.state}` : ""} {addr.postalCode || ""}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '2px' }}>Phone: {addr.phoneNumber}</p>
                      </div>
                      {addr.isDefault && (
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: '999px' }}>
                          Default
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div style={card}>
              <h2 style={sectionTitle}>Payment Method</h2>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* Credit Card */}
                <button
                  onClick={() => setPaymentMethod("card")}
                  style={{
                    flex: '1 1 45%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '24px',
                    borderRadius: '12px',
                    border: paymentMethod === "card" ? '2px solid #4f46e5' : '1px solid #ddd',
                    backgroundColor: paymentMethod === "card" ? '#eef2ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <CreditCard />
                    {paymentMethod === "card" && <CheckCircle2 />}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1f2937' }}>Credit / Debit Card</span>
                </button>

                {/* COD */}
                <button
                  onClick={() => setPaymentMethod("cod")}
                  style={{
                    flex: '1 1 45%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '24px',
                    borderRadius: '12px',
                    border: paymentMethod === "cod" ? '2px solid #4f46e5' : '1px solid #ddd',
                    backgroundColor: paymentMethod === "cod" ? '#eef2ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Truck />
                    {paymentMethod === "cod" && <CheckCircle2 />}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1f2937' }}>Cash on Delivery</span>
                </button>
              </div>

              {paymentMethod === "card" && (
                <div style={{ marginTop: '24px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--input-bg)' }}>
                  <CardElement options={cardElementOptions} />
                </div>
              )}
            </div>
          </div>

          {/* Right Column – Order Summary */}
          <div style={rightCol}>
            <div style={{ ...card, position: 'sticky', top: '96px' }}>
              <h2 style={sectionTitle}>
                <ShoppingBag /> Order Summary
              </h2>

              <div style={{ maxHeight: '256px', overflowY: 'auto', paddingRight: '8px' }}>
                {cart.items.map((item) => {
                  const productImage = item.productImage
                    ? getImageUrl(item.productImage)
                    : null;

                  return (
                    <div key={item.cartItemId} style={orderSummaryItem}>
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={item.productName}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '6px',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: '6px', backgroundColor: '#f3f4f6', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.productName}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Qty: {item.quantity}</p>
                      </div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                        PKR {(item.unitPrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
                  <span>Subtotal</span>
                  <span>PKR {calculateTotal().toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
                  <span>Shipping</span>
                  <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>Calculated next step</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #f3f4f6', fontWeight: 600, fontSize: '1rem', color: '#111827' }}>
                  <span>Total</span>
                  <span>PKR {calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <p style={{ marginTop: '16px', fontSize: '0.875rem', color: '#dc2626', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px' }}>
                  {error}
                </p>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddressId || (paymentMethod === "card" && !stripe)}
                style={{
                  marginTop: '24px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: (placing || !selectedAddressId || (paymentMethod === "card" && !stripe)) ? '#9ca3af' : '#111827',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: (placing || !selectedAddressId || (paymentMethod === "card" && !stripe)) ? 'not-allowed' : 'pointer',
                  opacity: (placing || !selectedAddressId || (paymentMethod === "card" && !stripe)) ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {placing ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Lock />
                    Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

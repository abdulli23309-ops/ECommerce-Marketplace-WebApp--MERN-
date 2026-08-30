import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { fetchCart } from "../../services/cartService";
import { fetchAddresses } from "../../services/addressService";
import { createPaymentIntent, fetchOrderPreview } from "../../services/orderService";
import { validateCoupon } from "../../services/couponService";
import { getImageUrl } from "../../utils/imageHelper";
import { formatPKR } from "../../utils/currency";
import { emptyCart } from "../../store/cartSlice";

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

const MobileIcon = () => (
  <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const WalletIcon = () => (
  <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
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

const pageBg = { minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', fontFamily: 'Arial, sans-serif' };
const container = { maxWidth: '1200px', margin: '0 auto', padding: '40px 16px' };
const twoCol = { display: 'flex', gap: '32px', flexWrap: 'wrap' };
const leftCol = { flex: '2', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' };
const rightCol = { flex: '1', minWidth: '280px' };
const card = { backgroundColor: 'var(--surface)', borderRadius: '16px', boxShadow: '0 1px 3px var(--shadow)', border: '1px solid var(--border)', padding: '24px' };
const sectionTitle = { fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' };
const btnPrimary = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' };
const btnGhost = { background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' };
const inputRadio = { accentColor: 'var(--primary)', marginRight: '12px' };
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
  const [mobileAccount, setMobileAccount] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  const [orderPreview, setOrderPreview] = useState(null);
  const [unavailableItems, setUnavailableItems] = useState([]);

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

    if (user.emailVerified !== true) {
      navigate("/verify-email", { state: { from: "/checkout" } });
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
        setError("Could not load cart or addresses.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  // Fetch authoritative totals (incl. real delivery charge) from the backend.
  // Refetches whenever the applied coupon changes so the summary matches what
  // will actually be charged at checkout.
  useEffect(() => {
    if (!user || user.emailVerified !== true) return;
    let cancelled = false;
    const loadPreview = async () => {
      try {
        const preview = await fetchOrderPreview(appliedCoupon?.code || null);
        if (!cancelled) {
          setOrderPreview(preview);
          setUnavailableItems(preview?.unavailableItems || []);
        }
      } catch {
        if (!cancelled) {
          setOrderPreview(null);
          setUnavailableItems([]);
        }
      }
    };
    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [user, appliedCoupon]);

  const cartTotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return setCouponError("Please enter a coupon code");
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await validateCoupon(couponCode.trim(), cartTotal());
      setAppliedCoupon(res.coupon);
      setDiscountAmount(res.discount || 0);
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon code");
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
    setCouponError(null);
  };

  const finalTotal = () => Math.max(0, cartTotal() - discountAmount);

  // Authoritative summary values from the backend preview (fall back to
  // client-side subtotal/total while the preview is loading).
  const previewLoaded = orderPreview !== null;
  const summarySubtotal = previewLoaded ? Number(orderPreview.subtotal || 0) : cartTotal();
  const summaryDelivery = previewLoaded ? Number(orderPreview.deliveryCharges || 0) : null;
  const summaryFreeDeliveryDiscount = previewLoaded ? Number(orderPreview.freeDeliveryDiscount || 0) : 0;
  const summaryTotal = previewLoaded ? Number(orderPreview.total || 0) : finalTotal();

  const hasUnavailableItems = !!unavailableItems?.length;

  const isMobileValid = /^03\d{9}$/.test(mobileAccount);
  const requiresMobile = paymentMethod === "easypaisa" || paymentMethod === "jazzcash";
  const canPlaceOrder = placing || !selectedAddressId || (paymentMethod === "card" && !stripe) || (requiresMobile && !isMobileValid);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) return setError("Please select a delivery address.");
    if (requiresMobile && !isMobileValid) return setError("Please enter a valid mobile account number (03XXXXXXXXX).");

    setPlacing(true);
    setError(null);

    try {
      if (paymentMethod === "card") {
        if (!stripe || !elements) {
          setError("Stripe is still loading. Please try again.");
          setPlacing(false);
          return;
        }

        const result = await createPaymentIntent(selectedAddressId, "Stripe", appliedCoupon?.code || null);
        const { clientSecret, order } = result;

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: elements.getElement(CardElement) },
          return_url: `${window.location.origin}/order-confirmation/${order._id}`,
        });

        if (stripeError) {
          setError(stripeError.message);
          setPlacing(false);
          return;
        }

        if (paymentIntent.status === "succeeded") {
          dispatch(emptyCart());
          navigate(`/order-confirmation/${order._id}?payment_intent=${paymentIntent.id}`);
        }
      } else {
        const result = await createPaymentIntent(
          selectedAddressId,
          paymentMethod === "cod" ? "CashOnDelivery" : paymentMethod === "easypaisa" ? "EasyPaisa" : "JazzCash",
          appliedCoupon?.code || null,
          paymentMethod === "easypaisa" || paymentMethod === "jazzcash" ? mobileAccount : null
        );
        dispatch(emptyCart());
        navigate(`/order-confirmation/${result.order._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Order could not be placed. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (user && user.emailVerified !== true) {
    return (
      <div style={{ ...pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ ...card, maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>Email Verification Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Please verify your email before placing an order.
          </p>
          <button style={btnPrimary} onClick={() => navigate('/verify-email', { state: { from: '/checkout' } })}>
            Verify Email
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ ...pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-secondary)', animation: 'pulse 1.5s infinite' }}>Loading checkout...</div>
    </div>;
  }

  if (!cart || cart.items?.length === 0) {
    return <div style={{ ...pageBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
      <ShoppingBag />
      <p style={{ fontSize: '1.125rem' }}>Your cart is empty.</p>
      <button onClick={() => navigate("/cart")} style={{ marginTop: '16px', background: 'none', border: 'none', color: 'var(--text-primary)', textDecoration: 'underline', cursor: 'pointer' }}>
        Go to Cart
      </button>
    </div>;
  }

  return (
    <div style={pageBg}>
      <div style={container}>
        <div style={twoCol}>
          <div style={leftCol}>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={sectionTitle}><MapPin /> Delivery Address</h2>
                <button style={btnGhost} onClick={() => navigate("/addresses")}><Plus /> Add New</button>
              </div>

              {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', border: '2px dashed var(--border)', borderRadius: '8px' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>No saved addresses yet.</p>
                  <button style={btnPrimary} onClick={() => navigate("/addresses")}><Plus /> Add an Address</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`checkout-select-card ${selectedAddressId === addr.id ? "selected" : ""}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '8px', border: selectedAddressId === addr.id ? '1px solid transparent' : '1px solid var(--border)', backgroundColor: selectedAddressId === addr.id ? 'var(--surface-hover)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <input type="radio" name="address" style={inputRadio} checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{addr.fullName}</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}, {addr.city}
                          {addr.state ? `, ${addr.state}` : ""} {addr.postalCode || ""}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Phone: {addr.phoneNumber}</p>
                      </div>
                      {addr.isDefault && <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--surface-hover)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '999px' }}>Default</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={card}>
              <h2 style={sectionTitle}>Payment Method</h2>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button onClick={() => setPaymentMethod("card")} className={`checkout-select-card ${paymentMethod === "card" ? "selected" : ""}`} style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', borderRadius: '12px', border: paymentMethod === "card" ? '1px solid transparent' : '1px solid var(--border)', backgroundColor: paymentMethod === "card" ? 'var(--surface-hover)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <CreditCard />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Credit / Debit Card</span>
                </button>

                <button onClick={() => setPaymentMethod("cod")} className={`checkout-select-card ${paymentMethod === "cod" ? "selected" : ""}`} style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', borderRadius: '12px', border: paymentMethod === "cod" ? '1px solid transparent' : '1px solid var(--border)', backgroundColor: paymentMethod === "cod" ? 'var(--surface-hover)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <Truck />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Cash on Delivery</span>
                </button>

                <button onClick={() => setPaymentMethod("easypaisa")} className={`checkout-select-card ${paymentMethod === "easypaisa" ? "selected" : ""}`} style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', borderRadius: '12px', border: paymentMethod === "easypaisa" ? '1px solid transparent' : '1px solid var(--border)', backgroundColor: paymentMethod === "easypaisa" ? 'var(--surface-hover)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <MobileIcon />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>EasyPaisa (Test)</span>
                </button>

                <button onClick={() => setPaymentMethod("jazzcash")} className={`checkout-select-card ${paymentMethod === "jazzcash" ? "selected" : ""}`} style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', borderRadius: '12px', border: paymentMethod === "jazzcash" ? '1px solid transparent' : '1px solid var(--border)', backgroundColor: paymentMethod === "jazzcash" ? 'var(--surface-hover)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <WalletIcon />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>JazzCash (Test)</span>
                </button>
              </div>

              {paymentMethod === "card" && (
                <div style={{ marginTop: '24px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--input-bg)' }}>
                  <CardElement options={cardElementOptions} />
                </div>
              )}

              {(paymentMethod === "easypaisa" || paymentMethod === "jazzcash") && (
                <div style={{ marginTop: '24px' }}>
                  <label className="form-label">Mobile Account Number</label>
                  <input
                    type="tel"
                    value={mobileAccount}
                    onChange={(e) => setMobileAccount(e.target.value)}
                    placeholder={paymentMethod === "easypaisa" ? "e.g. 03451234567" : "e.g. 03001234567"}
                    className="form-input"
                    maxLength="11"
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Test success: {paymentMethod === "easypaisa" ? "03451234567" : "03001234567"}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Test failure: 03009999999
                  </p>
                </div>
              )}
            </div>
          </div>

          <div style={rightCol}>
            <div style={{ ...card, position: 'sticky', top: '96px' }}>
              <h2 style={sectionTitle}><ShoppingBag /> Order Summary</h2>
              <div style={{ maxHeight: '256px', overflowY: 'auto', paddingRight: '8px' }}>
                {cart.items.map((item) => {
                  const productImage = item.productImage ? getImageUrl(item.productImage) : null;
                  return (
                    <div key={item.cartItemId || `${item.productId}-${item.quantity}`} style={orderSummaryItem}>
                      {productImage ? <img src={productImage} alt={item.productName} style={{ width: 48, height: 48, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 48, height: 48, borderRadius: '6px', backgroundColor: 'var(--surface-hover)', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Qty: {item.quantity}</p>
                      </div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>PKR {formatPKR(item.unitPrice * item.quantity)}</p>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" disabled={!!appliedCoupon} style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} />
                  {!appliedCoupon ? <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} style={{ padding: '10px 16px', backgroundColor: couponLoading ? 'var(--disabled-bg)' : 'var(--primary)', color: 'var(--primary-contrast)', border: 'none', borderRadius: '8px', cursor: couponLoading ? 'not-allowed' : 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>{couponLoading ? "..." : "Apply"}</button> : <button onClick={removeCoupon} style={{ padding: '10px 16px', backgroundColor: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>Remove</button>}
                </div>
                {couponError && <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--danger)' }}>{couponError}</p>}
                {appliedCoupon && <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--success-text)' }}>Coupon <strong>{appliedCoupon.code}</strong> applied: {appliedCoupon.discountType === "free_delivery" ? "Free Delivery" : `-PKR ${formatPKR(discountAmount)}`}</p>}
              </div>

              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}><span>Subtotal</span><span>PKR {formatPKR(summarySubtotal)}</span></div>
                {discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--success-text)' }}><span>Discount</span><span>-PKR {formatPKR(discountAmount)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span>Delivery</span>
                  {summaryDelivery === null
                    ? <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Calculating…</span>
                    : summaryDelivery === 0
                      ? <span style={{ color: 'var(--success-text)', fontWeight: 500 }}>Free</span>
                      : <span>PKR {formatPKR(summaryDelivery)}</span>}
                </div>
                {summaryFreeDeliveryDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--success-text)' }}><span>Free Delivery Discount</span><span>-PKR {formatPKR(summaryFreeDeliveryDiscount)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}><span>Total</span><span>PKR {formatPKR(summaryTotal)}</span></div>
              </div>

              {hasUnavailableItems && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger)',
                    borderRadius: '8px',
                    color: 'var(--danger-text)',
                    fontSize: '0.875rem',
                  }}
                >
                  <strong>Some items in your cart are no longer available.</strong> {unavailableItems.map((u, i) => (
                    <span key={i} style={{ marginLeft: '8px', color: 'var(--danger-text)' }}>
                      {u.productName}
                    </span>
                  ))}
                </div>
              )}

              {error && <p style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '12px', borderRadius: '8px' }}>{error}</p>}

              <button onClick={handlePlaceOrder} disabled={canPlaceOrder || hasUnavailableItems} style={{ marginTop: '24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: (canPlaceOrder && !hasUnavailableItems) ? 'var(--primary)' : 'var(--disabled-bg)', color: 'var(--primary-contrast)', padding: '12px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: (canPlaceOrder && !hasUnavailableItems) ? 'pointer' : 'not-allowed', opacity: (canPlaceOrder && !hasUnavailableItems) ? 1 : 0.5, transition: 'all 0.2s' }}>
                {placing ? <span>Processing...</span> : <><Lock /> Place Order</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
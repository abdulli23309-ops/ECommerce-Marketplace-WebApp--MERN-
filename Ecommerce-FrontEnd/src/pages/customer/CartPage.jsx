import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  loadCart,
  updateQuantity,
  removeFromCart,
  emptyCart,
} from "../../store/cartSlice";
import FreeDeliveryBadge from "../../components/common/FreeDeliveryBadge";

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(loadCart());
  }, [dispatch]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ productId, quantity: newQuantity }));
  };

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleClearCart = () => {
    dispatch(emptyCart());
  };

  const cartTotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const hasFreeDeliveryItems =
    Array.isArray(items) && items.some((item) => item.freeDelivery === true);

  if (status === "loading") {
    return (
      <div style={{ padding: "3rem", color: "var(--text-secondary)" }}>
        Loading cart...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Add some products to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="section-title">Shopping Cart</h1>

      <div className="cart-items">
        {items.map((item, index) => (
          <div
            className="cart-item"
            key={item.cartItemId || item.productId || `cart-item-${index}`}
          >
            <div className="cart-item-details">
              {item.productImage && (
                <img
                  src={
                    item.productImage.startsWith("http")
                      ? item.productImage
                      : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1.*$/, "") || ""}${item.productImage}`
                  }
                  alt={item.productName}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "0.25rem",
                    marginRight: "1rem",
                  }}
                />
              )}

              <div>
                <p className="cart-item-name">{item.productName}</p>
                <p className="cart-item-price">
                  PKR {item.unitPrice.toLocaleString()}
                </p>

                {item.freeDelivery === true && (
                  <FreeDeliveryBadge style={{ marginTop: "0.4rem" }} />
                )}
              </div>
            </div>

            <div className="cart-item-actions">
              <div className="quantity-control">
                <button
                  className="quantity-btn"
                  onClick={() =>
                    handleQuantityChange(item.productId, item.quantity - 1)
                  }
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span className="quantity-value">{item.quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={() =>
                    handleQuantityChange(item.productId, item.quantity + 1)
                  }
                >
                  +
                </button>
              </div>

              <button
                className="btn-remove"
                onClick={() => handleRemove(item.productId)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div>
          <button className="btn-remove" onClick={handleClearCart}>
            Clear Cart
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1rem",
            minWidth: "280px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1.5rem",
              color: "var(--text-muted)",
              fontSize: "0.9rem",
            }}
          >
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              PKR {cartTotal.toLocaleString()}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1.5rem",
              color: "var(--text-muted)",
              fontSize: "0.9rem",
            }}
          >
            <span>Estimated Shipping</span>
            <span
              style={{
                fontWeight: hasFreeDeliveryItems ? 600 : 400,
                fontSize: "0.85rem",
                color: hasFreeDeliveryItems
                  ? "#10b981"
                  : "var(--text-muted)",
              }}
            >
              {hasFreeDeliveryItems ? "FREE" : "Calculated at checkout"}
            </span>
          </div>
        </div>

        <div className="cart-total">
          Total: PKR {cartTotal.toLocaleString()}
        </div>

        <button
          className="btn-checkout"
          onClick={() => navigate("/checkout")}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;
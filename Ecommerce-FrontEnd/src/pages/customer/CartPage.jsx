import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  loadCart,
  updateQuantity,
  removeFromCart,
  emptyCart,
} from "../../store/cartSlice";

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(loadCart());
  }, [dispatch]);

  const handleQuantityChange = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ cartItemId, quantity: newQuantity }));
  };

  const handleRemove = (cartItemId) => {
    dispatch(removeFromCart(cartItemId));
  };

  const handleClearCart = () => {
    dispatch(emptyCart());
  };

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  if (status === "loading") {
    return <div style={{ padding: "3rem", color: "#666" }}>Loading cart...</div>;
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
        {items.map((item) => (
          <div className="cart-item" key={item.cartItemId}>
            <div className="cart-item-details">
              <p className="cart-item-name">{item.productName}</p>
              <p className="cart-item-price">PKR {item.unitPrice.toLocaleString()}</p>
            </div>

            <div className="cart-item-actions">
              <div className="quantity-control">
                <button
                  className="quantity-btn"
                  onClick={() =>
                    handleQuantityChange(item.cartItemId, item.quantity - 1)
                  }
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span className="quantity-value">{item.quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={() =>
                    handleQuantityChange(item.cartItemId, item.quantity + 1)
                  }
                >
                  +
                </button>
              </div>
              <button
                className="btn-remove"
                onClick={() => handleRemove(item.cartItemId)}
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
        <div className="cart-total">
          Total: PKR {calculateTotal().toLocaleString()}
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
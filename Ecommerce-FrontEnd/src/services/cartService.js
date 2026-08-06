import axiosInstance from "./axiosInstance";

// GET /api/v1/cart
export const fetchCart = async () => {
  const { data } = await axiosInstance.get("/cart");
  return transformCart(data.data);
};

// POST /api/v1/cart/items
export const addToCart = async (productId, quantity) => {
  const { data } = await axiosInstance.post("/cart/items", { productId, quantity });
  return transformCart(data.data);
};

// PUT /api/v1/cart/items
export const updateCartItemQuantity = async (productId, quantity) => {
  const { data } = await axiosInstance.put("/cart/items", { productId, quantity });
  return transformCart(data.data);
};

// DELETE /api/v1/cart/items
export const removeCartItem = async (productId) => {
  const { data } = await axiosInstance.delete("/cart/items", { data: { productId } });
  return transformCart(data.data);
};

// DELETE /api/v1/cart
export const clearCart = async () => {
  const { data } = await axiosInstance.delete("/cart");
  return transformCart(data.data);
};

/* ------------------------------------------------------------------ */
/*  Transform the raw MERN cart document into the shape the frontend   */
/*  expects: { items: [{ cartItemId, productId, productName,          */
/*                      unitPrice, quantity }] }                       */
/* ------------------------------------------------------------------ */
function transformCart(cart) {
  if (!cart || !Array.isArray(cart.items)) {
    return { items: [] };
  }
  const items = cart.items.map((item) => ({
    cartItemId: item._id,                       // Mongoose subdoc _id
    productId: item.product?._id || item.product,
    productName: item.product?.name || "Unknown",
    unitPrice: item.price,
    quantity: item.quantity,
  }));
  return { ...cart, items };
}
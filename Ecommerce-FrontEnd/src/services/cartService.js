import axiosInstance from "./axiosInstance";

function transformCart(cart) {
  if (!cart || !Array.isArray(cart.items)) {
    return { items: [] };
  }
  const items = cart.items.map((item) => ({
    cartItemId: item._id,
    productId: item.product?._id || item.product,
    productName: item.product?.name || "Unknown",
    unitPrice: item.price,
    quantity: item.quantity,
    productImage: item.product?.images?.[0] || null,
    // Preserve the live availability flag set by the backend
    available: item.available,
    // Preserve the free-delivery flag from the product record
    freeDelivery: item.product?.freeDelivery === true,
  }));
  return { ...cart, items };
}

export const fetchCart = async () => {
  const { data } = await axiosInstance.get("/cart");
  return transformCart(data.data);
};

export const addToCart = async (productId, quantity) => {
  const { data } = await axiosInstance.post("/cart/items", { productId, quantity });
  return transformCart(data.data);
};

export const updateCartItemQuantity = async (productId, quantity) => {
  const { data } = await axiosInstance.put("/cart/items", { productId, quantity });
  return transformCart(data.data);
};

export const removeCartItem = async (productId) => {
  const { data } = await axiosInstance.delete("/cart/items", { data: { productId } });
  return transformCart(data.data);
};

export const clearCart = async () => {
  const { data } = await axiosInstance.delete("/cart");
  return transformCart(data.data);
};
import axiosInstance from "./axiosInstance";
import { fetchProductById } from "./productService"; // reuse existing public product fetch

const transformWishlist = async (wishlist) => {
  const rawProducts = wishlist?.products || [];

  const items = await Promise.all(
    rawProducts.map(async (product) => {
      // If product is already populated (object with _id), use it directly
      if (product && typeof product === "object" && product._id) {
        return {
          productId: product._id,
          productName: product.name || "Untitled Product",
          productImage: product.images?.[0] || null,
          price: product.price || 0,
        };
      }

      // Otherwise, product is an ObjectId string → fetch details
      const productId = typeof product === "string" ? product : product?._id;
      try {
        const fullProduct = await fetchProductById(productId);
        return {
          productId: fullProduct.id,
          productName: fullProduct.name || "Untitled Product",
          productImage: fullProduct.images?.[0] || null,
          price: fullProduct.price || 0,
        };
      } catch (err) {
        console.error(`Failed to load product ${productId} for wishlist`, err);
        return {
          productId,
          productName: "Unavailable Product",
          productImage: null,
          price: 0,
        };
      }
    })
  );

  return {
    items,
    totalCount: items.length,
  };
};

export const fetchWishlist = async () => {
  const { data } = await axiosInstance.get("/wishlist");
  return await transformWishlist(data.data);
};

export const addToWishlist = async (productId) => {
  const { data } = await axiosInstance.post("/wishlist/items", { productId });
  return await transformWishlist(data.data);
};

export const removeFromWishlist = async (productId) => {
  const { data } = await axiosInstance.delete("/wishlist/items", {
    data: { productId },
  });
  return await transformWishlist(data.data);
};

export const clearWishlist = async () => {
  const { data } = await axiosInstance.delete("/wishlist");
  return await transformWishlist(data.data);
};
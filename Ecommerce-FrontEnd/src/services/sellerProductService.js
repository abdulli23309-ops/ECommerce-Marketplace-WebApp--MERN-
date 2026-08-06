import axiosInstance from "./axiosInstance";

// Helper to unwrap MERN response and map product fields
const mapProduct = (p) => ({
  ...p,
  id: p._id,
  basePrice: p.price,
  stockQuantity: p.stock,
});

export const fetchSellerProducts = async () => {
  const response = await axiosInstance.get("/products");
  const products = response.data?.data ?? [];
  return products.map(mapProduct);
};

export const createProduct = async (productData) => {
  const response = await axiosInstance.post("/products", productData);
  return mapProduct(response.data?.data);
};

export const updateProduct = async (productId, productData) => {
  const response = await axiosInstance.put(`/products/${productId}`, productData);
  return mapProduct(response.data?.data);
};

export const deleteProduct = async (productId) => {
  await axiosInstance.delete(`/products/${productId}`);
};

export const uploadProductImage = async (productId, file) => {
  const formData = new FormData();
  formData.append("images", file);
  const response = await axiosInstance.put(`/products/${productId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data?.data?.images ?? [];
};

export const deleteProductImage = async (productId, imageUrl) => {
  // MERN doesn't have individual image delete yet – we can omit or send a PUT with filtered images
  console.warn("deleteProductImage not implemented on MERN backend");
};
import axiosInstance from "./axiosInstance";

export const getProducts = async () => {
  const { data } = await axiosInstance.get("/admin/products");
  // data.data is now { products: [...], total, page, totalPages }
  return data.data?.products || data.data || [];
};

export const getProductById = async (productId) => {
  const { data } = await axiosInstance.get(`/admin/products/${productId}`);
  return data.data;
};

export const updateProductStatus = async (productId, status, reason = '', note = '') => {
  const { data } = await axiosInstance.put(`/admin/products/${productId}/status`, {
    status,
    reason,
    internalNote: note
  });
  return data.data;
};
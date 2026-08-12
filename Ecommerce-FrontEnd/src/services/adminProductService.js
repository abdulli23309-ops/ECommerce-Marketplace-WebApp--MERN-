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

// services/adminProductService.js

export const updateProductStatus = async (productId, status, rejectionReason = '', internalNote = '') => {
  const payload = { status };
  if (rejectionReason) payload.rejectionReason = rejectionReason;
  if (internalNote) payload.internalNote = internalNote;
  
  const { data } = await axiosInstance.put(
    `/admin/products/${productId}/status`,
    payload
  );
  return data.data || data;
};
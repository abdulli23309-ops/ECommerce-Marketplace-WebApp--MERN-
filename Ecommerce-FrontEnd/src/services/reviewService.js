import axiosInstance from "./axiosInstance";

export const fetchProductReviews = async (productId, { page = 1, pageSize = 10 } = {}) => {
  const { data } = await axiosInstance.get(`/reviews/product/${productId}`, { params: { page, pageSize } });
  return data.data ?? { items: [], total: 0, page: 1, totalPages: 1 };
};

export const fetchMyReviews = async ({ page = 1, pageSize = 10 } = {}) => {
  const { data } = await axiosInstance.get("/reviews/mine", { params: { page, pageSize } });
  return data.data ?? { items: [], total: 0, page: 1, totalPages: 1 };
};
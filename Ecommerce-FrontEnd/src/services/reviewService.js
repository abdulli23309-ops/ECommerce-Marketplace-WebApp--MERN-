import axiosInstance from "./axiosInstance";

export const fetchProductReviews = async (productId) => {
  const { data } = await axiosInstance.get(`/reviews/product/${productId}`);
  return data.data ?? [];
};

export const fetchMyReviews = async () => {
  const { data } = await axiosInstance.get("/reviews/mine");
  return data.data ?? [];
};
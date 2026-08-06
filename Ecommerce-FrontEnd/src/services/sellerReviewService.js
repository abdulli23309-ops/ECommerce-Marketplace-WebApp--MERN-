import axiosInstance from "./axiosInstance";

export const fetchStoreReviews = async (page = 1, pageSize = 10) => {
  const response = await axiosInstance.get("/seller/reviews", {
    params: { page, pageSize },
  });
  return response.data?.data ?? [];
};
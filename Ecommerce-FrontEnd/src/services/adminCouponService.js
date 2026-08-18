import axiosInstance from "./axiosInstance";

export const fetchCoupons = async (params = {}) => {
  const { data } = await axiosInstance.get("/coupons", { params });
  return data.data || {};
};

export const createCoupon = async (payload) => {
  const { data } = await axiosInstance.post("/coupons", payload);
  return data.data || data;
};

export const updateCoupon = async (id, payload) => {
  const { data } = await axiosInstance.patch(`/coupons/${id}`, payload);
  return data.data || data;
};

export const deleteCoupon = async (id) => {
  const { data } = await axiosInstance.delete(`/coupons/${id}`);
  return data.data || data;
};
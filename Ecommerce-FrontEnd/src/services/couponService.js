import axiosInstance from "./axiosInstance";

export const validateCoupon = async (code, cartTotal) => {
  const { data } = await axiosInstance.post("/coupons/validate", {
    code,
    cartTotal,
  });
  return data.data || {};
};
import axiosInstance from "./axiosInstance";

export const sendOtp = async (purpose = "account_verification") => {
  const { data } = await axiosInstance.post("/auth/otp/send", {
    purpose,
  });

  return data.data || data;
};

export const verifyOtp = async (otp, purpose = "account_verification") => {
  const { data } = await axiosInstance.post("/auth/otp/verify", {
    otp,
    purpose,
  });

  return data.data || data;
};
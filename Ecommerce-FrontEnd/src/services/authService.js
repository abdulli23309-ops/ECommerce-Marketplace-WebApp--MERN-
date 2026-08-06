import axiosInstance from "./axiosInstance";

// Extract the data property from the MERN backend response
const unwrap = (response) => response.data?.data ?? response.data;

export const loginUser = async (email, password) => {
  const response = await axiosInstance.post("/auth/login", { email, password });
  return unwrap(response); // { user, accessToken, refreshToken }
};

export const registerUser = async (fullName, email, password, confirmPassword) => {
  // MERN backend expects "name", not "fullName"
  const response = await axiosInstance.post("/auth/register", {
    name: fullName,
    email,
    password,
  });
  return unwrap(response);
};

export const refreshAccessToken = async (refreshToken) => {
  const response = await axiosInstance.post("/auth/refresh-token", {
    refreshToken,
  });
  return unwrap(response);
};

export const logoutUser = async (refreshToken) => {
  await axiosInstance.post("/auth/logout", { refreshToken });
};

// This will be updated later when we migrate the profile page
export const updateProfile = async (name, email) => {
  const { data } = await axiosInstance.put("/account/profile", { name, email });
  return data.data; // { user }
};
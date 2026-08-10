import axios from "axios";
import { store } from "../store/store";
import { logout, setCredentials } from "../store/authSlice";
import { clearPermissions } from "../store/permissionsSlice";
import { refreshAccessToken } from "./authService";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token on every request
axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 – attempt token refresh, then retry
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = store.getState().auth.refreshToken;
        if (refreshToken) {
          const data = await refreshAccessToken(refreshToken);
          store.dispatch(setCredentials({
            user: store.getState().auth.user, // user stays the same
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }));
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        store.dispatch(logout());
        store.dispatch(clearPermissions());
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
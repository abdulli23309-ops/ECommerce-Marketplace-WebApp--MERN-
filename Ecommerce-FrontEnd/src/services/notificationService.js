import axiosInstance from "./axiosInstance";

export const fetchNotifications = async (params = {}) => {
  const { data } = await axiosInstance.get("/notifications", { params });
  return data.data || {};
};

export const fetchUnreadCount = async () => {
  const { data } = await axiosInstance.get("/notifications/unread-count");
  return data.data || { unreadCount: 0 };
};

export const markNotificationRead = async (id) => {
  const { data } = await axiosInstance.patch(`/notifications/${id}/read`);
  return data.data || data;
};
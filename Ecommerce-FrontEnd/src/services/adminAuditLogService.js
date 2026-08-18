import axiosInstance from "./axiosInstance";

export const fetchAuditLogs = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/audit-logs", { params });
  return data.data || {};
};
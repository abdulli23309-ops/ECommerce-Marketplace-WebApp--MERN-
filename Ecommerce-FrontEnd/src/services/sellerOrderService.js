import axiosInstance from "./axiosInstance";

export const fetchSellerOrders = async ({ page = 1, pageSize = 10 } = {}) => {
  const response = await axiosInstance.get("/seller/orders", { params: { page, pageSize } });
  return response.data?.data ?? { items: [], total: 0, page: 1, totalPages: 1 };
};

export const updateShipmentStatus = async (shipmentId, status, note = "") => {
  const response = await axiosInstance.put(`/shipments/${shipmentId}/status`, { status, note });
  return response.data?.data;
};
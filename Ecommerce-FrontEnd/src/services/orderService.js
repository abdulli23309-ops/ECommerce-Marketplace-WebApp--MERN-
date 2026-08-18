import axiosInstance from "./axiosInstance";

export const fetchOrders = async ({ page = 1, pageSize = 10 } = {}) => {
  const { data } = await axiosInstance.get("/orders", { params: { page, pageSize } });
  return data.data ?? { items: [], total: 0, page: 1, totalPages: 1 };
};

export const fetchOrderById = async (orderId) => {
  const { data } = await axiosInstance.get(`/orders/${orderId}`);
  return data.data;
};

export const placeOrder = async (addressId) => {
  const { data } = await axiosInstance.post("/orders/checkout", { addressId });
  return data.data;
};

export const createPaymentIntent = async (addressId, paymentMethod, couponCode = null) => {
  const { data } = await axiosInstance.post("/payments/create-intent", {
    addressId,
    paymentMethod,
    couponCode,
  });
  return data.data || data;
};

export const cancelOrder = async (orderId) => {
  const { data } = await axiosInstance.put(`/orders/${orderId}/cancel`);
  return data.data;
};
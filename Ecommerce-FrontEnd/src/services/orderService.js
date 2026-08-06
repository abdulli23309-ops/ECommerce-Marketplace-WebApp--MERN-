import axiosInstance from "./axiosInstance";

export const fetchOrders = async () => {
  const { data } = await axiosInstance.get("/orders");
  return data.data ?? []; // array of ParentOrders
};

export const fetchOrderById = async (orderId) => {
  const { data } = await axiosInstance.get(`/orders/${orderId}`);
  return data.data;
};

export const placeOrder = async (addressId) => {
  const { data } = await axiosInstance.post("/orders/checkout", { addressId });
  return data.data;
};
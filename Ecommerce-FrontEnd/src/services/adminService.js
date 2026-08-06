import axiosInstance from "./axiosInstance";

export const getSellers = async () => {
  const { data } = await axiosInstance.get("/admin/sellers");
  return (data.data || []).map((s) => ({
    id: s._id,
    businessName: s.businessName,
    fullName: s.user?.name || "",
    email: s.user?.email || "",
    storeName: "", // not populated – can add later
    storeLogoUrl: "",
    status: s.status,
  }));
};

export const approveSeller = async (sellerId) => {
  const { data } = await axiosInstance.put(`/admin/sellers/${sellerId}/approve`);
  return data.data;
};

export const rejectSeller = async (sellerId, reason) => {
  const { data } = await axiosInstance.put(`/admin/sellers/${sellerId}/reject`, {
    rejectionReason: reason,
  });
  return data.data;
};

export const getProducts = async () => {
  const { data } = await axiosInstance.get("/admin/products");
  return (data.data || []).map((p) => ({
    id: p._id,
    name: p.name,
    storeName: p.store?.name || "N/A",
    basePrice: p.price,
    stockQuantity: p.stock,
    status: p.status,
  }));
};

export const updateProductStatus = async (productId, status) => {
  const { data } = await axiosInstance.put(`/admin/products/${productId}/status`, {
    status,
  });
  return data.data;
};

export const getReturns = async () => {
  const { data } = await axiosInstance.get("/admin/returns");
  return (data.data || []).map((r) => ({
    id: r._id,
    customerEmail: r.customer?.email || "",
    productName: r.product?.name || "",
    reason: r.reason,
    status: r.status,
  }));
};

export const approveReturn = async (returnId) => {
  const { data } = await axiosInstance.put(`/returns/${returnId}/process`, {
    status: "Approved",
  });
  return data.data;
};

export const rejectReturn = async (returnId) => {
  const { data } = await axiosInstance.put(`/returns/${returnId}/process`, {
    status: "Rejected",
  });
  return data.data;
};

export const createRefund = async (returnRequestId) => {
  const { data } = await axiosInstance.post("/refunds", { returnRequestId });
  return data.data;
};

export const getPayments = async () => {
  const { data } = await axiosInstance.get("/admin/payments");
  return (data.data || []).map((p) => ({
    paymentId: p._id,
    orderId: p.parentOrder,
    method: p.method,
    amount: p.amount,
    status: p.status,
    createdAt: p.createdAt,
  }));
};

export const getAdminStats = async () => {
  const { data } = await axiosInstance.get("/admin/stats");
  return data.data;
};

export const getAdminOrders = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/orders", { params });
  return data.data; // array of parent orders
};

export const getAdminShipments = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/shipments", { params });
  return (data.data || []).map((s) => ({
    id: s._id,
    // ensure sellerOrderId is a plain id string when possible
    sellerOrderId: s.sellerOrder && (typeof s.sellerOrder === "string" ? s.sellerOrder : (s.sellerOrder._id || null)),
    carrier: s.carrier,
    trackingNumber: s.trackingNumber,
    status: s.status,
    createdAt: s.createdAt,
  }));
};

export const getAdminUsers = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/users", { params });
  return data.data; // array of user objects (with _id, name, email, roles, isActive)
};
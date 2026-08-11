import axiosInstance from "./axiosInstance";

// Helper to normalize backend paginated response
const extractItems = (responseData) => {
  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    return responseData.items || responseData;
  }
  return Array.isArray(responseData) ? responseData : [];
};

// ---------- Sellers ----------
export const getSellers = async () => {
  const { data } = await axiosInstance.get("/admin/sellers");
  const sellers = extractItems(data.data);
  return {
    items: sellers.map(s => ({
      id: s._id,
      businessName: s.businessName,
      fullName: s.user?.name || "",
      email: s.user?.email || "",
      storeName: s.store?.name || "",
      storeLogoUrl: s.store?.logo || "",
      storeDescription: s.store?.description || "",
      status: s.status,
    })),
    total: sellers.length,
    page: 1,
    totalPages: 1,
  };
};

export const approveSeller = async (sellerId) => {
  const { data } = await axiosInstance.put(`/admin/sellers/${sellerId}/approve`);
  return data.data;
};

export const rejectSeller = async (sellerId, reason) => {
  const { data } = await axiosInstance.put(`/admin/sellers/${sellerId}/reject`, { reason });
  return data.data;
};

// ---------- Products (admin) ----------
export const getProducts = async () => {
  const { data } = await axiosInstance.get("/admin/products");
  const products = extractItems(data.data);
  return {
    items: products.map(p => ({
      id: p._id,
      name: p.name,
      storeName: p.store?.name || "N/A",
      basePrice: p.price,
      stockQuantity: p.stock,
      status: p.status,
    })),
    total: products.length,
    page: 1,
    totalPages: 1,
  };
};

export const updateProductStatus = async (productId, status) => {
  const { data } = await axiosInstance.put(`/admin/products/${productId}/status`, { status });
  return data.data;
};

// ---------- Returns ----------
export const getReturns = async () => {
  const { data } = await axiosInstance.get("/returns/admin");
  // The backend returns { success, data: [... ] }
  return data.data || data;
};

export const approveReturn = async (returnId) => {
  const { data } = await axiosInstance.put(`/returns/${returnId}/admin-decision`, {
    decision: 'APPROVE',
  });
  return data.data;
};

export const rejectReturn = async (returnId) => {
  const { data } = await axiosInstance.put(`/returns/${returnId}/admin-decision`, {
    decision: 'REJECT',
  });
  return data.data;
};

// ---------- Refunds ----------
export const createRefund = async (returnRequestId) => {
  const { data } = await axiosInstance.post("/refunds", { returnRequestId });
  return data.data;
};

// ---------- Payments ----------
export const getPayments = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/payments", { params });
  const payments = extractItems(data.data);
  return {
    items: payments.map(p => ({
      paymentId: p._id,
      orderId: p.parentOrder,
      method: p.method,
      amount: p.amount,
      status: p.status,
      createdAt: p.createdAt,
    })),
    total: payments.length,
    page: 1,
    totalPages: 1,
  };
};

// ---------- Admin Orders ----------
export const getAdminOrders = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/orders", { params });
  const items = extractItems(data.data);
  return {
    items,
    total: items.length,
    page: 1,
    totalPages: 1,
  };
};

// ---------- Admin Shipments ----------
export const getAdminShipments = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/shipments", { params });
  const items = extractItems(data.data);
  return {
    items: items.map(s => ({
      id: s._id,
      sellerOrderId: s.sellerOrder?._id || s.sellerOrder,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      status: s.status,
      createdAt: s.createdAt,
    })),
    total: items.length,
    page: 1,
    totalPages: 1,
  };
};

// ---------- Admin Users ----------
export const getAdminUsers = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/users", { params });
  const items = extractItems(data.data);
  return {
    items,
    total: items.length,
    page: 1,
    totalPages: 1,
  };
};

// ---------- Admin Stats ----------
export const getAdminStats = async () => {
  const { data } = await axiosInstance.get("/admin/stats");
  return data.data;
};
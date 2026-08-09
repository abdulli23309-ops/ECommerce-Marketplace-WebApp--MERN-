import axiosInstance from "./axiosInstance";

// Helper to normalize backend paginated response
const extractItems = (responseData) => {
  // Backend returns { success, data: { items, ... } } or { success, data: [...] }
  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    return responseData.items || responseData; // { items: [...] } => [...]
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
      storeName: s.store?.name || "",          // ← store name
      storeLogoUrl: s.store?.logo || "",       // ← store logo path
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
// This uses separate service file now, keep for backward compat if needed
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
// ---------- Returns ----------
export const getReturns = async () => {
  const { data } = await axiosInstance.get("/admin/returns");
  const returns = extractItems(data.data);
  return {
    items: returns.map(r => ({
      id: r._id,
      customerEmail: r.customer?.email || "",
      productName: r.product?.name || "",
      reason: r.reason,
      description: r.description || "",   // ← new field
      images: r.images || [],             // ← new field (array of strings)
      status: r.status,
    })),
    total: returns.length,
    page: 1,
    totalPages: 1,
  };
};

export const approveReturn = async (returnId) => {
  const { data } = await axiosInstance.put(`/returns/${returnId}/process`, { status: "Approved" });
  return data.data;
};

export const rejectReturn = async (returnId) => {
  const { data } = await axiosInstance.put(`/returns/${returnId}/process`, { status: "Rejected" });
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
  // items are already full objects, no mapping needed
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
    items, // already have _id, name, email, roles, isActive
    total: items.length,
    page: 1,
    totalPages: 1,
  };
};

// ---------- Admin Stats ----------
export const getAdminStats = async () => {
  const { data } = await axiosInstance.get("/admin/stats");
  return data.data; // single object
};
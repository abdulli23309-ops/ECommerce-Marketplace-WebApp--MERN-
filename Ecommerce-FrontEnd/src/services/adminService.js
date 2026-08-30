import axiosInstance from "./axiosInstance";

// ---------- Normalisation helpers ----------
const normalizeItems = (responseData) => {
  if (Array.isArray(responseData)) return responseData;

  if (
    responseData &&
    typeof responseData === "object" &&
    Array.isArray(responseData.items)
  ) {
    return responseData.items;
  }

  return [];
};

const normalizePagination = (responseData, fallbackPage, fallbackPageSize) => {
  const payload =
    responseData && typeof responseData === "object" ? responseData : {};

  const items = payload.items ? payload.items : normalizeItems(responseData);

  const total = payload.total ?? items.length;
  const page = payload.page ?? fallbackPage;
  const pageSize = payload.pageSize ?? fallbackPageSize;
  const totalPages =
    payload.totalPages ?? Math.ceil(total / (pageSize || 1));

  return { items, total, page, pageSize, totalPages };
};

// ---------- Sellers ----------
export const getSellers = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/sellers", { params });
  const pagination = normalizePagination(
    data.data,
    params.page || 1,
    params.pageSize || 10
  );

  return {
  items: pagination.items.map((s) => ({
    id: s._id,
    businessName: s.businessName,
    fullName: s.user?.name || "",
    email: s.user?.email || "",
    storeName: s.store?.name || "",
    storeLogoUrl: s.store?.logo || "",
    storeDescription: s.store?.description || "",
    phone: s.phone || "",
    address: s.address || "",
    taxId: s.taxId || "",
    city: s.store?.city || "",
    status: s.status,
    averageRating: s.averageRating ?? s.avgRating ?? 0,
    lowRatingStatus: s.lowRatingStatus === true,
    warningCount: s.warningCount || 0,
    warningHistory: s.warningHistory || [],
    user: s.user,
    store: s.store,
    // Moderation fields
    activeSuspension: s.activeSuspension,
    pendingAppeal: s.pendingAppeal,
    lastRejectedAppeal: s.lastRejectedAppeal,
    moderationStatus: s.moderationStatus,
  })),
    total: pagination.total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
};

export const approveSeller = async (sellerId) => {
  const { data } = await axiosInstance.put(
    `/admin/sellers/${sellerId}/approve`
  );
  return data.data || data;
};

export const rejectSeller = async (sellerId, reason) => {
  const { data } = await axiosInstance.put(
    `/admin/sellers/${sellerId}/reject`,
    { reason }
  );
  return data.data || data;
};

export const warnSeller = async (sellerId, reason = "") => {
  const { data } = await axiosInstance.post(
    `/admin/sellers/${sellerId}/warn`,
    { reason }
  );
  return data.data || data;
};

export const getSellerModerationStatus = async (sellerId) => {
  const { data } = await axiosInstance.get(
    `/admin/sellers/${sellerId}/moderation-status`
  );
  return data.data || {};
};

// ---------- Products (admin) ----------
export const getProducts = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/products", { params });
  const payload = data.data || {};
  const products = payload.products || payload.items || [];

  return {
    items: products.map((p) => ({
      id: p._id,
      name: p.name,
      storeName: p.store?.name || "N/A",
      basePrice: p.price,
      stockQuantity: p.stock,
      status: p.status,
      images: p.images,
      category: p.category,
      subCategory: p.subCategory,
      rejectionReason: p.rejectionReason,
      internalNote: p.internalNote,
      store: p.store,
    })),
    total: payload.total ?? products.length,
    page: payload.page ?? params.page ?? 1,
    pageSize: payload.pageSize ?? params.pageSize ?? 10,
    totalPages:
      payload.totalPages ??
      Math.ceil((payload.total ?? products.length) / (params.pageSize || 10)),
  };
};

export const updateProductStatus = async (productId, status, reason, note) => {
  const payload = { status };
  if (reason) payload.reason = reason;
  if (note) payload.note = note;

  const { data } = await axiosInstance.put(
    `/admin/products/${productId}/status`,
    payload
  );
  return data.data || data;
};

// ---------- Returns ----------
export const getReturns = async (params = {}) => {
  const { data } = await axiosInstance.get("/returns/admin", { params });
  const pagination = normalizePagination(
    data.data,
    params.page || 1,
    params.pageSize || 10
  );

  return pagination;
};

export const approveReturn = async (returnId) => {
  const { data } = await axiosInstance.put(
    `/returns/${returnId}/admin-decision`,
    { decision: "APPROVE" }
  );
  return data.data || data;
};

export const rejectReturn = async (returnId) => {
  const { data } = await axiosInstance.put(
    `/returns/${returnId}/admin-decision`,
    { decision: "REJECT" }
  );
  return data.data || data;
};

// ---------- Refunds ----------
export const createRefund = async (returnRequestId) => {
  const { data } = await axiosInstance.post("/refunds", { returnRequestId });
  return data.data || data;
};

// ---------- Payments ----------
export const getPayments = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/payments", { params });
  const pagination = normalizePagination(
    data.data,
    params.page || 1,
    params.pageSize || 10
  );

  return {
    items: pagination.items.map((p) => ({
      paymentId: p._id,
      orderId: p.parentOrder,
      method: p.method,
      amount: p.amount,
      status: p.status,
      createdAt: p.createdAt,
    })),
    total: pagination.total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
};

// ---------- Admin Orders ----------
export const getAdminOrders = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/orders", { params });
  return normalizePagination(
    data.data,
    params.page || 1,
    params.pageSize || 10
  );
};

// ---------- Admin Shipments ----------
export const getAdminShipments = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/shipments", { params });
  const pagination = normalizePagination(
    data.data,
    params.page || 1,
    params.pageSize || 10
  );

  return {
    items: pagination.items.map((s) => ({
      id: s._id,
      sellerOrderId: s.sellerOrder?._id || s.sellerOrder,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      status: s.status,
      createdAt: s.createdAt,
    })),
    total: pagination.total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
};

// ---------- Admin Users ----------
export const getAdminUsers = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/users", { params });
  return normalizePagination(
    data.data,
    params.page || 1,
    params.pageSize || 10
  );
};

// ---------- Admin Stats ----------
export const getAdminStats = async () => {
  const { data } = await axiosInstance.get("/admin/stats");
  return data.data || {};
};

// ---------- Seller Suspension & Appeals (Admin) ----------
export const suspendSeller = async (sellerId, reason, internalNote = '') => {
  const { data } = await axiosInstance.post(
    `/admin/sellers/${sellerId}/suspend`,
    { reason, internalNote }
  );
  return data.data || data;
};

export const reinstateSeller = async (sellerId) => {
  const { data } = await axiosInstance.post(
    `/admin/sellers/${sellerId}/reinstate`
  );
  return data.data || data;
};

export const getSellerTimeline = async (sellerId) => {
  const { data } = await axiosInstance.get(
    `/admin/sellers/${sellerId}/timeline`
  );
  return data.data || {};
};

export const getSellerAppeals = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/seller-appeals", { params });
  const payload = data.data || data;
  const items = payload.items || payload || [];
  return {
    items: items.map((a) => ({
      id: a._id,
      sellerProfile: a.sellerProfile,
      sellerName: a.sellerProfile?.businessName || a.sellerProfile?.user?.name || a.sellerName || '—',
      sellerEmail: a.sellerProfile?.user?.email || '—',
      storeName: a.sellerProfile?.store?.name || '—',
      suspension: a.suspension,
      suspensionReason: a.suspension?.reason || '',
      suspendedAt: a.suspension?.suspendedAt || '',
      status: a.status,
      appealText: a.appealText,
      submittedBy: a.submittedBy,
      submittedAt: a.submittedAt,
      decidedAt: a.decidedAt,
      decidedBy: a.decidedBy,
      decisionReason: a.decisionReason,
      history: a.history,
      warningCount: a.sellerProfile?.warningCount || 0,
    })),
    total: payload.total ?? items.length,
    page: payload.page ?? params.page ?? 1,
    pageSize: payload.pageSize ?? params.pageSize ?? 10,
    totalPages:
      payload.totalPages ??
      Math.ceil((payload.total ?? items.length) / (params.pageSize || 10)),
  };
};

export const decideSellerAppeal = async (appealId, decision, decisionReason) => {
  const { data } = await axiosInstance.put(
    `/admin/seller-appeals/${appealId}/decision`,
    { decision, decisionReason }
  );
  return data.data || data;
};

// ---------- Seller Suspension & Appeals (Seller) ----------
export const getMySuspensionStatus = async () => {
  const { data } = await axiosInstance.get("/seller/suspension");
  return data.data || {};
};

export const submitAppeal = async (appealText) => {
  const { data } = await axiosInstance.post("/seller/appeals", { appealText });
  return data.data || data;
};

export const getMyAppeals = async (params = {}) => {
  const { data } = await axiosInstance.get("/seller/appeals", { params });
  const payload = data.data || data;
  const items = payload.items || payload || [];
  return {
    items: items.map((a) => ({
      id: a._id,
      suspension: a.suspension,
      status: a.status,
      appealText: a.appealText,
      submittedAt: a.submittedAt,
      decidedAt: a.decidedAt,
      decidedBy: a.decidedBy,
      decisionReason: a.decisionReason,
      history: a.history,
    })),
    total: payload.total ?? items.length,
    page: payload.page ?? params.page ?? 1,
    pageSize: payload.pageSize ?? params.pageSize ?? 10,
    totalPages:
      payload.totalPages ??
      Math.ceil((payload.total ?? items.length) / (params.pageSize || 10)),
  };
};

export const getMyAppealById = async (appealId) => {
  const { data } = await axiosInstance.get(`/seller/appeals/${appealId}`);
  return data.data || data;
};

// ---------- Seller Product Republish ----------
// NOTE: This is a SELLER action (republish own Suspended product). The backend
// canonical contract aligns with the PUT-based edit/update pattern used by the
// product routes: PUT /api/v1/seller/products/:id/republish. It requires the
// Seller.Products.Edit permission and only works after the seller has been
// reinstated (resolveStore blocks suspended sellers). Suspended products stay
// unpublished and must be explicitly republished — no premature visibility.
export const republishMyProduct = async (productId) => {
  const { data } = await axiosInstance.put(`/seller/products/${productId}/republish`);
  return data.data || data;
};
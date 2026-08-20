import axiosInstance from "./axiosInstance";

export const getProducts = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/products", { params });
  const payload = data.data || {};
  const items = payload.products || payload.items || [];

  return {
    items,
    total: payload.total ?? items.length,
    page: payload.page ?? params.page ?? 1,
    pageSize: payload.pageSize ?? params.pageSize ?? 10,
    totalPages:
      payload.totalPages ??
      Math.ceil((payload.total ?? items.length) / (params.pageSize || 10)),
  };
};

export const getProductById = async (productId) => {
  const { data } = await axiosInstance.get(`/admin/products/${productId}`);
  return data.data;
};

export const getProductStats = async () => {
  const { data } = await axiosInstance.get("/admin/products/stats");
  return data.data || data;
};

export const updateProductStatus = async (
  productId,
  status,
  rejectionReason = "",
  internalNote = ""
) => {
  const payload = { status };

  if (rejectionReason) payload.rejectionReason = rejectionReason;
  if (internalNote) payload.internalNote = internalNote;

  const { data } = await axiosInstance.put(
    `/admin/products/${productId}/status`,
    payload
  );

  return data.data || data;
};

export const warnProduct = async (productId, reason = "") => {
  const { data } = await axiosInstance.post(
    `/admin/products/${productId}/warn`,
    { reason }
  );
  return data.data || data;
};

export const getProductModerationStatus = async (productId) => {
  const { data } = await axiosInstance.get(
    `/admin/products/${productId}/moderation-status`
  );
  return data.data || data;
};
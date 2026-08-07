import axiosInstance from "./axiosInstance";

const mapProduct = (p) => ({
  ...p,
  id: p._id,
  basePrice: p.price,      // keep basePrice for backward compatibility, but we'll use price
  price: p.price,
  stockQuantity: p.stock,
});

export const fetchApprovedProducts = async (params = {}) => {
  if (typeof params === 'number') {
    params = { page: arguments[0], pageSize: arguments[1] || 100 };
  }
  const { data } = await axiosInstance.get("/products/public", { params });
  const body = data.data;
  return {
    items: (body.products || []).map(mapProduct),
    totalPages: body.totalPages,
    total: body.total,
    page: body.page,
    pageSize: body.pageSize,
  };
};

export const fetchProductById = async (id) => {
  const { data } = await axiosInstance.get(`/products/public/${id}`);
  const product = data.data;
  return mapProduct(product);
};
import axiosInstance from "./axiosInstance";

const mapProduct = (p) => ({
  ...p,
  id: p._id,
  basePrice: p.price,
  price: p.price,
  stockQuantity: p.stock,
});

export const fetchApprovedProducts = async (params = {}) => {
  // backward compatibility: allow passing (page, pageSize) as numbers
  if (typeof params === 'number') {
    params = { page: arguments[0], pageSize: arguments[1] || 100 };
  }

  const { data } = await axiosInstance.get("/products", { params });
  const body = data.data || {};
  const items = body.items || body.products || [];

  return {
    items: items.map(mapProduct),
    totalPages: body.totalPages,
    total: body.total,
    page: body.page,
    pageSize: body.pageSize,
  };
};

export const fetchProductById = async (id) => {
  const { data } = await axiosInstance.get(`/products/${id}`);
  const product = data.data || data;
  return mapProduct(product);
};
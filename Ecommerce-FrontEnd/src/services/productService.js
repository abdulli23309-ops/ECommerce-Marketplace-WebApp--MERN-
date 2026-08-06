import axiosInstance from "./axiosInstance";

const mapProduct = (p) => ({
  ...p,
  id: p._id,
  basePrice: p.price,
  stockQuantity: p.stock,
});

export const fetchApprovedProducts = async (params = {}) => {
  const { data } = await axiosInstance.get("/products/public", { params });
  const response = data.data; // { products, page, pageSize, total, totalPages }
  return {
    items: (response.products || []).map(mapProduct),
    totalPages: response.totalPages,
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
  };
};

export const fetchProductById = async (id) => {
  const { data } = await axiosInstance.get(`/products/public/${id}`);
  const product = data.data;
  return mapProduct(product);
};
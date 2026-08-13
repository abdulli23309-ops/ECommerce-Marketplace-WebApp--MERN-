import axiosInstance from "./axiosInstance";

// ---------- Mapper (includes populated names, createdAt) ----------
const mapProduct = (p) => ({
  id: p._id,
  _id: p._id,
  name: p.name,
  description: p.description,
  images: p.images,
  price: p.price,
  basePrice: p.price,
  stock: p.stock,
  stockQuantity: p.stock,
  status: p.status,
  category: p.category?.name || p.category,
  categoryId: p.category?._id || p.category,          // for selects
  subCategory: p.subCategory?.name || p.subCategory,
  subCategoryId: p.subCategory?._id || p.subCategory,
  brand: p.brand?.name || p.brand,
  brandId: p.brand?._id || p.brand,
  store: p.store,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
    avgRating: p.avgRating || 0,
  reviewCount: p.reviewCount || 0,
    rejectionReason: p.rejectionReason || '',
  internalNote: p.internalNote || '',
});

// ---------- Paginated fetch for seller's own products ----------
export const fetchSellerProducts = async ({ page = 1, pageSize = 12 } = {}) => {
  const { data } = await axiosInstance.get("/seller/products", { params: { page, pageSize } });
  const body = data.data;   // { products, total, page, totalPages }
  return {
    items: (body.products || []).map(mapProduct),
    total: body.total,
    page: body.page,
    totalPages: body.totalPages,
  };
};

// ---------- Fetch single product (for editing) ----------
export const fetchProductById = async (productId) => {
  const { data } = await axiosInstance.get(`/products/public/${productId}`);
  return mapProduct(data.data);
};

// ---------- Create a new product (multipart for images) ----------
export const createProduct = async (formData) => {
  const { data } = await axiosInstance.post("/seller/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapProduct(data.data);
};

// ---------- Update an existing product ----------
export const updateProduct = async (productId, formData) => {
  const { data } = await axiosInstance.put(`/seller/products/${productId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapProduct(data.data);
};

// ---------- Delete a product ----------
export const deleteProduct = async (productId) => {
  const { data } = await axiosInstance.delete(`/seller/products/${productId}`);
  return data.data;
};
// Fetch RAW product (with populated objects) for editing
export const fetchRawProductById = async (productId) => {
  const { data } = await axiosInstance.get(`/products/${productId}`);
  return data.data;  // returns full object with category: { _id, name }, etc.
};
export const fetchSellerProductById = (productId) =>
  axiosInstance.get(`/products/${productId}`).then(res => res.data.data);
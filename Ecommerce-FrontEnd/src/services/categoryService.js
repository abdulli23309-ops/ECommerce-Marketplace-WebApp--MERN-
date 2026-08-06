import axiosInstance from "./axiosInstance";

export const fetchCategories = async () => {
  const { data } = await axiosInstance.get("/categories");
  return data.data.map((cat) => ({ id: cat._id, name: cat.name }));
};

export const fetchSubCategories = async (categoryId) => {
  const { data } = await axiosInstance.get(`/subcategories?category=${categoryId}`);
  return data.data.map((sub) => ({ id: sub._id, name: sub.name }));
};
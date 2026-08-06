import axiosInstance from "./axiosInstance";

export const fetchBrands = async () => {
  const { data } = await axiosInstance.get("/brands");
  return data.data.map((brand) => ({ id: brand._id, name: brand.name }));
};
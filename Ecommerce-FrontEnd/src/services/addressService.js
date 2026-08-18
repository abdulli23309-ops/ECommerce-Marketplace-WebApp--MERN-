import axiosInstance from "./axiosInstance";

const mapAddress = (addr) => ({
  id: addr._id,
  fullName: addr.fullName,
  phoneNumber: addr.phoneNumber,
  addressLine1: addr.street,
  addressLine2: addr.addressLine2 || "",
  city: addr.city,
  state: addr.state,
  postalCode: addr.postalCode,
  country: addr.country,
  isDefault: addr.isDefault,
});

export const fetchAddresses = async () => {
  const { data } = await axiosInstance.get("/addresses");
  return (data.data || []).map(mapAddress);
};

export const addAddress = async (address) => {
  const { data } = await axiosInstance.post("/addresses", {
    fullName: address.fullName,
    phoneNumber: address.phoneNumber,
    street: address.addressLine1,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  });
  return mapAddress(data.data);
};

export const updateAddress = async (id, address) => {
  await axiosInstance.put(`/addresses/${id}`, {
    fullName: address.fullName,
    phoneNumber: address.phoneNumber,
    street: address.addressLine1,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  });
};

export const deleteAddress = async (id) => {
  await axiosInstance.delete(`/addresses/${id}`);
};

export const setDefaultAddress = async (id) => {
  await axiosInstance.put(`/addresses/${id}/default`);
};
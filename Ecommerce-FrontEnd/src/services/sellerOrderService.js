import axiosInstance from "./axiosInstance";

// Fetch seller's own orders (backend endpoint: GET /api/orders?role=seller or we need a specific endpoint)
// Our backend currently has GET /api/orders that returns orders for the current user (customer).
// For seller orders, we might need a new backend endpoint. But we already have GET /api/admin/orders that returns all orders,
// and seller orders are part of ParentOrder -> SellerOrders. The seller can filter by their store.
// The simplest approach: we already have GET /api/orders returning customer orders. To get seller orders, we need a new endpoint or we can use the admin endpoint temporarily.
// I'll assume we have a GET /api/seller/orders endpoint (we may need to create it in the backend). But for now, let's reuse the admin endpoint GET /api/admin/orders and filter on the frontend?
// Not ideal. I'll create a quick backend endpoint or instruct to add GET /api/seller/orders.
// In the master prompt, it says "list seller orders (filter from seller's store orders)" – so we can use the existing GET /api/orders? No, that's for customers.
// We'll need to add a backend endpoint. I'll provide the backend code to add quickly.

// For speed, I'll assume we'll add a backend endpoint: GET /api/seller/orders that returns orders containing the seller's store products.
// We'll provide the service call now, and the backend code later.

export const fetchSellerOrders = async () => {
  const response = await axiosInstance.get("/seller/orders");
  return response.data?.data ?? [];
};

export const updateShipmentStatus = async (shipmentId, status, location) => {
  const response = await axiosInstance.put(`/shipments/${shipmentId}/status`, {
    status,
    note: location || "",
  });
  return response.data?.data;
};
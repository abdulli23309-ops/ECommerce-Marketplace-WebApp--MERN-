import * as adminManagementService from '../services/Admin.management.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

// Users
export const getUsers = asyncHandler(async (req, res) => {
  const users = await adminManagementService.getUsers();
  new ApiResponse(200, users, 'Users retrieved').send(res);
});
export const activateUser = asyncHandler(async (req, res) => {
  const user = await adminManagementService.activateUser(req.params.id);
  new ApiResponse(200, user, 'User activated').send(res);
});
export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await adminManagementService.deactivateUser(req.params.id);
  new ApiResponse(200, user, 'User deactivated').send(res);
});

// Sellers
export const getSellers = asyncHandler(async (req, res) => {
  const sellers = await adminManagementService.getSellers();
  new ApiResponse(200, sellers, 'Sellers retrieved').send(res);
});
export const approveSeller = asyncHandler(async (req, res) => {
  const seller = await adminManagementService.approveSeller(req.params.id);
  new ApiResponse(200, seller, 'Seller approved').send(res);
});
export const rejectSeller = asyncHandler(async (req, res) => {
  const seller = await adminManagementService.rejectSeller(req.params.id, req.body.rejectionReason);
  new ApiResponse(200, seller, 'Seller rejected').send(res);
});

// Products
export const getAllProducts = asyncHandler(async (req, res) => {
  const products = await adminManagementService.getAllProducts();
  new ApiResponse(200, products, 'Products retrieved').send(res);
});
export const updateProductStatus = asyncHandler(async (req, res) => {
  const product = await adminManagementService.updateProductStatus(req.params.id, req.body.isActive);
  new ApiResponse(200, product, 'Product status updated').send(res);
});

// Orders
export const getAllParentOrders = asyncHandler(async (req, res) => {
  const orders = await adminManagementService.getAllParentOrders();
  new ApiResponse(200, orders, 'Orders retrieved').send(res);
});
export const getAllSellerOrders = asyncHandler(async (req, res) => {
  const orders = await adminManagementService.getAllSellerOrders();
  new ApiResponse(200, orders, 'Seller orders retrieved').send(res);
});

// Payments
export const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await adminManagementService.getAllPayments();
  new ApiResponse(200, payments, 'Payments retrieved').send(res);
});

// Shipments
export const getAllShipments = asyncHandler(async (req, res) => {
  const shipments = await adminManagementService.getAllShipments();
  new ApiResponse(200, shipments, 'Shipments retrieved').send(res);
});

// Returns
export const getAllReturns = asyncHandler(async (req, res) => {
  const returns = await adminManagementService.getAllReturns();
  new ApiResponse(200, returns, 'Returns retrieved').send(res);
});

// Refunds
export const getAllRefunds = asyncHandler(async (req, res) => {
  const refunds = await adminManagementService.getAllRefunds();
  new ApiResponse(200, refunds, 'Refunds retrieved').send(res);
});

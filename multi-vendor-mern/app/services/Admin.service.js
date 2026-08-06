import User from '../models/User.model.js';
import Product from '../models/Product.model.js';
import ParentOrder from '../models/ParentOrder.model.js';
import SellerProfile from '../models/SellerProfile.model.js';
import ReturnRequest from '../models/Return.model.js';

export const getStats = async () => {
  const [
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    approvedSellers,
    pendingSellers,
    approvedProducts,
    pendingProducts,
    pendingReturns,
  ] = await Promise.all([
    User.countDocuments(),
    SellerProfile.countDocuments(),
    Product.countDocuments({ isDeleted: false }),
    ParentOrder.countDocuments(),
    SellerProfile.countDocuments({ status: 'Approved' }),
    SellerProfile.countDocuments({ status: 'Pending' }),
    Product.countDocuments({ isDeleted: false, status: 'Approved' }),
    Product.countDocuments({ isDeleted: false, status: 'PendingApproval' }),
    ReturnRequest.countDocuments({ status: 'Requested' }),
  ]);

  // Calculate total revenue from all parent orders
  const revenueResult = await ParentOrder.aggregate([
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;

  return {
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    totalRevenue,
    pendingSellerApprovals: pendingSellers,
    pendingProductApprovals: pendingProducts,
    pendingReturns,
  };
};
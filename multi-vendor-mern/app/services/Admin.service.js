import User from '../models/User.model.js';
import Product from '../models/Product.model.js';
import ParentOrder from '../models/ParentOrder.model.js';
import SellerProfile from '../models/SellerProfile.model.js';

export const getStats = async () => {
  const [totalUsers, totalProducts, totalOrders, totalSellers] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ isDeleted: false }),
    ParentOrder.countDocuments(),
    SellerProfile.countDocuments(),
  ]);

  return {
    totalUsers,
    totalProducts,
    totalOrders,
    totalSellers,
  };
};
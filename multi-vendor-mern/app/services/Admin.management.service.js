import User from '../models/User.model.js';
import Role from '../models/Role.model.js';
import SellerProfile from '../models/SellerProfile.model.js';
import Product from '../models/Product.model.js';
import ParentOrder from '../models/ParentOrder.model.js';
import SellerOrder from '../models/SellerOrder.model.js';
import Payment from '../models/Payment.model.js';
import Shipment from '../models/Shipment.model.js';
import ReturnRequest from '../models/Return.model.js';
import Refund from '../models/Refund.model.js';
import { ApiError } from '../utils/ApiError.util.js';
import Store from '../models/Store.model.js';  

// User Management
export const getUsers = () => User.find().select('-password -refreshTokens');
export const activateUser = (id) => User.findByIdAndUpdate(id, { isActive: true }, { new: true });
export const deactivateUser = (id) => User.findByIdAndUpdate(id, { isActive: false }, { new: true });

// Seller Management
export const getSellers = () => SellerProfile.find().populate('user', 'name email');
export const approveSeller = async (id) => {
  const profile = await SellerProfile.findByIdAndUpdate(
    id,
    { status: 'Approved', approvedAt: new Date() },
    { new: true }
  );
  if (!profile) throw new ApiError(404, 'Seller profile not found');

  // Reactivate the store
  await Store.findOneAndUpdate(
    { sellerProfile: profile._id },
    { isActive: true }
  );

  // ✅ Add the Seller role to the user
  const sellerRole = await Role.findOne({ name: 'Seller' });
  if (sellerRole) {
    await User.findByIdAndUpdate(
      profile.user,
      { $addToSet: { roles: sellerRole._id } }  // add only if not already present
    );
  }

  return profile;
};

// Product Management
export const getAllProducts = () =>
  Product.find({ isDeleted: false })
    .populate('store', 'name')
    .lean();
export const updateProductStatus = (id, status) =>
  Product.findByIdAndUpdate(id, { status }, { new: true });

// Order Management
export const getAllParentOrders = () =>
  ParentOrder.find().populate('customer', 'name email');
export const getAllSellerOrders = () =>
  SellerOrder.find().populate('parentOrder').populate('store');

// Payment Management
export const getAllPayments = () => Payment.find();

// Shipment Management
export const getAllShipments = () => Shipment.find().populate('sellerOrder');

// Return Management
export const getAllReturns = () => ReturnRequest.find().populate('customer', 'name').populate('product', 'name');

// Refund Management
export const getAllRefunds = () => Refund.find().populate('returnRequest').populate('payment');

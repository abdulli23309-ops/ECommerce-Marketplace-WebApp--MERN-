import mongoose from 'mongoose'; 
import User from '../models/User.model.js';
import SellerProfile from '../models/SellerProfile.model.js';
import ParentOrder from '../models/ParentOrder.model.js';
import Product from '../models/Product.model.js';
import Payment from '../models/Payment.model.js';
import Shipment from '../models/Shipment.model.js';
import ReturnRequest from '../models/Return.model.js';
import Refund from '../models/Refund.model.js';
import PermissionGroup from '../models/PermissionGroup.model.js';
import Role from '../models/Role.model.js';
import Permission from '../models/Permission.model.js'; 
// ---------- Users ----------
export const findUsers = async ({ page = 1, pageSize = 10, search, role, isActive }) => {
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (isActive !== undefined && isActive !== '') {
    query.isActive = isActive === 'true';
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  let usersPromise = User.find(query)
    .populate('roles', 'name')
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPromise = User.countDocuments(query);

  const [users, total] = await Promise.all([usersPromise, totalPromise]);

  let filteredUsers = users;
  if (role) {
    filteredUsers = users.filter(u => u.roles.some(r => r.name === role));
  }

  return {
    items: filteredUsers.map(({ password, refreshTokens, ...rest }) => rest),
    total: role ? filteredUsers.length : total,
    page: Number(page),
    pageSize: limit,
    totalPages: Math.ceil((role ? filteredUsers.length : total) / limit),
  };
};

// ---------- Sellers ----------
// ---------- Sellers ----------
export const findSellers = async ({ page = 1, pageSize = 10, search, status }) => {
  const query = {};
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  let pipeline = SellerProfile.find(query)
    .populate('user', 'name email')
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPromise = SellerProfile.countDocuments(query);

  const [profiles, total] = await Promise.all([pipeline, totalPromise]);

  // Fetch stores for these profiles
  const storeIds = profiles.map(p => p._id);
  const stores = await mongoose.model('Store').find({ sellerProfile: { $in: storeIds } }).lean();
  const storeMap = new Map(stores.map(s => [s.sellerProfile.toString(), s]));

  let items = profiles.map(p => ({
    ...p,
    store: storeMap.get(p._id.toString()) || null,
  }));

  if (search) {
    const regex = new RegExp(search, 'i');
    items = items.filter(p =>
      regex.test(p.businessName) ||
      regex.test(p.user?.name) ||
      regex.test(p.user?.email) ||
      regex.test(p.store?.name)
    );
  }

  return {
    items,
    total: search ? items.length : total,
    page: Number(page),
    pageSize: limit,
    totalPages: Math.ceil((search ? items.length : total) / limit),
  };
};
// ---------- Orders (ID search added) ----------
export const findOrders = async ({ page = 1, pageSize = 10, search, status, sortBy }) => {
  const query = {};
  if (status) query.orderStatus = status;

  if (search) {
    query.$or = [
      { 'customer.name': { $regex: search, $options: 'i' } },
      { 'customer.email': { $regex: search, $options: 'i' } },
      { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: search, options: 'i' } } },
    ];
  }

  const sort = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [items, total] = await Promise.all([
    ParentOrder.find(query)
      .populate('customer', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    ParentOrder.countDocuments(query),
  ]);

  return { items, total, page: Number(page), pageSize: limit, totalPages: Math.ceil(total / limit) };
};

// ---------- Payments (ID and parentOrder search added) ----------
export const findPayments = async ({ page = 1, pageSize = 10, search, status, method }) => {
  const query = {};
  if (status) query.status = status;
  if (method) query.method = method;

  if (search) {
    query.$or = [
      { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: search, options: 'i' } } },
      { $expr: { $regexMatch: { input: { $toString: '$parentOrder' }, regex: search, options: 'i' } } },
    ];
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [items, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query),
  ]);

  return { items, total, page: Number(page), pageSize: limit, totalPages: Math.ceil(total / limit) };
};

// ---------- Shipments (ID search added) ----------
export const findShipments = async ({ page = 1, pageSize = 10, search, status }) => {
  const query = {};
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { carrier: { $regex: search, $options: 'i' } },
      { trackingNumber: { $regex: search, $options: 'i' } },
      { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: search, options: 'i' } } },
    ];
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [items, total] = await Promise.all([
    Shipment.find(query)
      .populate('sellerOrder', 'parentOrder')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Shipment.countDocuments(query),
  ]);

  return { items, total, page: Number(page), pageSize: limit, totalPages: Math.ceil(total / limit) };
};
export const findAllPermissions = () => Permission.find({}).lean();
// ---------- Returns ----------
export const findReturns = async ({ page = 1, pageSize = 10, search, status }) => {
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { 'customer.name': { $regex: search, $options: 'i' } },
      { 'customer.email': { $regex: search, $options: 'i' } },
      { 'product.name': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [items, total] = await Promise.all([
    ReturnRequest.find(query)
      .populate('customer', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ReturnRequest.countDocuments(query),
  ]);

  return { items, total, page: Number(page), pageSize: limit, totalPages: Math.ceil(total / limit) };
};

// ---------- Refunds ----------
export const findRefunds = async ({ page = 1, pageSize = 10, search, status }) => {
  const query = {};
  if (status) query.status = status;
  if (search) {
    query._id = { $regex: search, $options: 'i' };
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [items, total] = await Promise.all([
    Refund.find(query)
      .populate('returnRequest', 'reason')
      .populate('payment', 'amount method')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Refund.countDocuments(query),
  ]);

  return { items, total, page: Number(page), pageSize: limit, totalPages: Math.ceil(total / limit) };
};

// ---------- Permission Groups ----------
export const findPermissionGroups = async ({ page = 1, pageSize = 10, search, sortBy }) => {
  const query = {};
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const sort = sortBy === 'name_desc' ? { name: -1 } : { name: 1 };
  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [items, total] = await Promise.all([
    PermissionGroup.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    PermissionGroup.countDocuments(query),
  ]);

  return { items, total, page: Number(page), pageSize: limit, totalPages: Math.ceil(total / limit) };
};

// ---------- Roles ----------
export const findRoles = async ({ page = 1, pageSize = 10, search }) => {
  const query = {};
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [items, total] = await Promise.all([
    Role.find(query)
      .populate('permissionGroups', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Role.countDocuments(query),
  ]);

  return { items, total, page: Number(page), pageSize: limit, totalPages: Math.ceil(total / limit) };
};

// ---------- Stats ----------
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
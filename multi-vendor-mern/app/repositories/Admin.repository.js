import mongoose from 'mongoose';
import User from '../models/User.model.js';
import SellerProfile from '../models/SellerProfile.model.js';
import SellerSuspension from '../models/SellerSuspension.model.js';
import SellerAppeal from '../models/SellerAppeal.model.js';
import ParentOrder from '../models/ParentOrder.model.js';
import Product from '../models/Product.model.js';
import Payment from '../models/Payment.model.js';
import Shipment from '../models/Shipment.model.js';
import { ApiError } from '../utils/ApiError.util.js';
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
  if (role) {
    query.role = role;
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [items, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  return {
    items: items.map(({ password, refreshTokens, ...rest }) => rest),
    total,
    page: Number(page),
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
};

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

  const sellerProfileIds = profiles.map(p => p._id);
  const stores = await mongoose.model('Store').find({ sellerProfile: { $in: sellerProfileIds } }).lean();
  const storeMap = new Map(stores.map(s => [s.sellerProfile.toString(), s]));

  // Fetch active suspensions and pending/rejected appeals for moderation badges
  const [activeSuspensions, pendingAppeals, recentRejectedAppeals] = await Promise.all([
    SellerSuspension.find({ sellerProfile: { $in: sellerProfileIds }, status: 'Active' }).lean(),
    SellerAppeal.find({ sellerProfile: { $in: sellerProfileIds }, status: 'Pending' }).lean(),
    SellerAppeal.find({ sellerProfile: { $in: sellerProfileIds }, status: 'Rejected' })
      .sort({ decidedAt: -1 })
      .lean(),
  ]);

  const activeSuspensionMap = new Map(activeSuspensions.map(s => [s.sellerProfile.toString(), s]));
  const pendingAppealMap = new Map(pendingAppeals.map(a => [a.sellerProfile.toString(), a]));
  // Build rejected appeal map keeping only the most recent per seller.
  // Results are sorted by decidedAt descending, so the first entry per seller key is newest.
  const rejectedAppealMap = new Map();
  for (const a of recentRejectedAppeals) {
    const key = a.sellerProfile.toString();
    if (!rejectedAppealMap.has(key)) {
      rejectedAppealMap.set(key, a);
    }
  }

  let items = profiles.map(p => {
    const id = p._id.toString();
    const activeSuspension = activeSuspensionMap.get(id);
    const pendingAppeal = pendingAppealMap.get(id);
    const rejectedAppeal = rejectedAppealMap.get(id);

    // Derive moderation status per spec:
    // - Suspended + pending appeal -> "Appeal Pending"
    // - Suspended + recent rejected appeal / cooldown -> "Appeal Rejected"
    // - Suspended otherwise -> "Suspended"
    // - Approved + low rating or warning count > 0 -> "At Risk"
    // - Approved otherwise -> "Active"
    // - Pending / Rejected remain application statuses
    let moderationStatus = p.status;
    if (p.status === 'Suspended') {
      if (pendingAppeal) moderationStatus = 'Appeal Pending';
      else if (rejectedAppeal) moderationStatus = 'Appeal Rejected';
      else moderationStatus = 'Suspended';
    } else if (p.status === 'Approved') {
      const rating = Number(p.averageRating ?? p.avgRating ?? 0);
      const lowRating = p.lowRatingStatus === true || (rating > 0 && rating < 3.0);
      const warningCount = p.warningCount || 0;
      if (lowRating || warningCount > 0) moderationStatus = 'At Risk';
      else moderationStatus = 'Active';
    }

    return {
      ...p,
      store: storeMap.get(id) || null,
      activeSuspension: activeSuspension || null,
      pendingAppeal: pendingAppeal || null,
      lastRejectedAppeal: rejectedAppeal || null,
      moderationStatus,
    };
  });

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

// ---------- Orders ----------
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

// ---------- Payments (with sort) ----------
export const findPayments = async ({ page = 1, pageSize = 10, search, status, method, sortBy = 'newest' }) => {
  const query = {};
  if (status) query.status = status;
  if (method) query.method = method;

  if (search) {
    query.$or = [
      { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: search, options: 'i' } } },
      { $expr: { $regexMatch: { input: { $toString: '$parentOrder' }, regex: search, options: 'i' } } },
    ];
  }

  let sortOption = { createdAt: -1 };
  if (sortBy === 'oldest') sortOption = { createdAt: 1 };
  else if (sortBy === 'amount_asc') sortOption = { amount: 1 };
  else if (sortBy === 'amount_desc') sortOption = { amount: -1 };

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [items, total] = await Promise.all([
    Payment.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query),
  ]);

  return { items, total, page: Number(page), pageSize: limit, totalPages: Math.ceil(total / limit) };
};

// ---------- Shipments ----------
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
    pendingSellers,
    pendingProducts,
    pendingReturns,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'Seller' }),
    Product.countDocuments({ isDeleted: false }),
    ParentOrder.countDocuments(),
    SellerProfile.countDocuments({ status: 'Pending' }),
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

// ---------- User Activation / Deactivation (with self-protection) ----------
const ensureNotSelf = (userId, adminId) => {
  if (userId.toString() === adminId.toString()) {
    throw new ApiError(403, 'You cannot modify your own account');
  }
};

export const activateUser = async (id, adminId) => {
  ensureNotSelf(id, adminId);
  return User.findByIdAndUpdate(id, { isActive: true }, { new: true }).lean();
};

export const deactivateUser = async (id, adminId) => {
  ensureNotSelf(id, adminId);
  return User.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
};

// ---------- Permission Groups CRUD ----------
export const createPermissionGroup = (data) => PermissionGroup.create(data);
export const updatePermissionGroup = (id, data) =>
  PermissionGroup.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
export const deletePermissionGroup = (id) =>
  PermissionGroup.findByIdAndDelete(id).lean();

// ---------- Misc ----------
export const findAllPermissions = () => Permission.find({}).lean();

export const rejectSeller = (sellerId, reason) =>
  SellerProfile.findByIdAndUpdate(
    sellerId,
    { status: 'Rejected', rejectionReason: reason, approvedAt: null, approvedBy: null },
    { new: true }
  );

// ---------- Missing admin operations ----------
export const processReturn = async (returnId, status, adminId, reason) => {
  return ReturnRequest.findByIdAndUpdate(
    returnId,
    {
      status,
      processedBy: adminId,
      adminNotes: reason || '',
    },
    { new: true }
  ).lean();
};

export const createRefund = async (returnRequestId, adminId) => {
  // This is a stub to keep Admin.service.js compatible.
  // Replace with actual Refund.service.js logic if needed later.
  return {
    returnRequest: returnRequestId,
    processedBy: adminId,
    status: 'Created',
    createdAt: new Date(),
  };
};

// ---------- Roles & Permission Groups ----------
export const findRoleById = (id) =>
  Role.findById(id)
    .populate('permissions')
    .populate('permissionGroups')
    .lean();

export const assignGroupToRole = async (roleId, groupId) => {
  return Role.findByIdAndUpdate(
    roleId,
    { $addToSet: { permissionGroups: groupId } },
    { new: true }
  ).populate('permissionGroups');
};

export const removeGroupFromRole = async (roleId, groupId) => {
  return Role.findByIdAndUpdate(
    roleId,
    { $pull: { permissionGroups: groupId } },
    { new: true }
  ).populate('permissionGroups');
};
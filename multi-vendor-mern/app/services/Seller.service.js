import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import * as userRepo from '../repositories/User.repository.js';
import SellerOrder from '../models/SellerOrder.model.js';
import Shipment from '../models/Shipment.model.js';
import Store from '../models/Store.model.js';
import Payment from '../models/Payment.model.js';
import { notifyAdmins } from './Notification.service.js';
import { ApiError } from '../utils/ApiError.util.js';

/**
 * Helper – retrieves profile and store (both may be null)
 */
const getStoreId = async (userId) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  const store = profile
    ? await Store.findOne({ sellerProfile: profile._id })
    : null;
  return { profile, store };
};

const ensureEmailVerified = async (userId) => {
  const user = await userRepo.findById(userId, 'emailVerified');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.emailVerified) {
    throw new ApiError(403, 'Please verify your email before applying to become a seller.');
  }
};

// ---------- Seller profile ----------
export const getProfile = (userId) => sellerProfileRepo.findByUser(userId);

export const createProfile = (userId, data) =>
  sellerProfileRepo.create({ ...data, user: userId });

// ---------- Seller orders (null‑safe) ----------
export const getSellerOrders = async (userId) => {
  const { store } = await getStoreId(userId);
  if (!store) return [];

  const sellerOrders = await SellerOrder.find({ store: store._id })
    .populate('parentOrder', 'orderStatus totalAmount createdAt')
    .populate('items.product', 'name')
    .lean();

  const sellerOrderIds = sellerOrders.map(so => so._id);

  const shipments = await Shipment.find({
    sellerOrder: { $in: sellerOrderIds }
  }).lean();

  const shipmentMap = new Map();
  shipments.forEach(s => {
    shipmentMap.set(s.sellerOrder.toString(), s);
  });

  const parentOrderIds = [
    ...new Set(
      sellerOrders
        .map(so => so.parentOrder?._id?.toString())
        .filter(Boolean)
    )
  ];

  // Fetch payments – only include completed/refunded parent orders
  const payments = await Payment.find({
    parentOrder: { $in: parentOrderIds },
  })
    .select('parentOrder method status')
    .lean();

  const paymentMap = new Map();
  payments.forEach(p => {
    paymentMap.set(p.parentOrder.toString(), {
      method: p.method,
      status: p.status,
    });
  });

  const grouped = new Map();

  for (const so of sellerOrders) {
    if (!so.parentOrder) continue;

    const pid = so.parentOrder._id.toString();
    const payment = paymentMap.get(pid);

    // Hide orders where payment is not completed or refunded
    if (!payment || !['Completed', 'Refunded'].includes(payment.status)) {
      continue;
    }

    if (!grouped.has(pid)) {
      grouped.set(pid, {
        _id: so.parentOrder._id,
        orderStatus: so.parentOrder.orderStatus,
        totalAmount: so.parentOrder.totalAmount,
        createdAt: so.parentOrder.createdAt,
        paymentMethod: payment.method || 'N/A',
        sellerOrders: [],
      });
    }

    grouped.get(pid).sellerOrders.push({
      _id: so._id,
      store: so.store,
      status: so.status,
      subTotal: so.subTotal,
      items: so.items,
      shipment: shipmentMap.get(so._id.toString()) || null,
    });
  }

  return Array.from(grouped.values());
};

// Single seller order – throws if no store or not found
export const getSellerOrderById = async (userId, sellerOrderId) => {
  const { store } = await getStoreId(userId);
  if (!store) throw new ApiError(404, 'Seller order not found');

  const order = await SellerOrder.findOne({
    _id: sellerOrderId,
    store: store._id,
  })
    .populate('store', 'name')
    .lean();

  if (!order) throw new ApiError(404, 'Seller order not found');
  return order;
};

// ---------- Apply as Seller (create or update) ----------
export const applyAsSeller = async (userId, body, files) => {
  await ensureEmailVerified(userId);

  const {
    businessName,
    description,
    phone,
    address,
    taxId,
    storeName,
    storeDescription,
    city,
  } = body;

  if (!businessName || !storeName) {
    throw new ApiError(400, 'Business name and store name are required');
  }

  let profile = await sellerProfileRepo.findByUser(userId);

  const storeData = {
    name: storeName,
    description: storeDescription || '',
    city: city || null,
    isActive: false,
  };

  if (files && files.length > 0) {
    storeData.logo = `/uploads/products/${files[0].filename}`;
  }

  if (profile) {
    // Update existing profile
    profile.businessName = businessName;
    profile.description = description || '';
    profile.phone = phone || profile.phone || '';
    profile.address = address || profile.address || '';
    profile.taxId = taxId || profile.taxId || '';
    profile.status = 'Pending';
    profile.rejectionReason = null;
    await profile.save();

    let store = await Store.findOne({ sellerProfile: profile._id });
    if (store) {
      store.name = storeData.name;
      store.description = storeData.description;
      store.city = storeData.city || store.city;
      if (storeData.logo) store.logo = storeData.logo;
      await store.save();
    } else {
      store = await Store.create({ ...storeData, sellerProfile: profile._id });
    }

    await notifyAdmins(
      'seller',
      'Seller Application Updated',
      `${profile.businessName || 'A seller'} updated their seller application.`,
      '/admin/sellers',
      { sellerProfileId: profile._id.toString() }
    );

    return { profile, store };
  }

  // Create new profile and store
  profile = await sellerProfileRepo.create({
    user: userId,
    businessName,
    description: description || '',
    phone: phone || '',
    address: address || '',
    taxId: taxId || '',
    status: 'Pending',
  });

  const store = await Store.create({
    ...storeData,
    sellerProfile: profile._id,
  });

  await notifyAdmins(
    'seller',
    'New Seller Application',
    `${profile.businessName || 'A new seller'} applied to become a seller.`,
    '/admin/sellers',
    { sellerProfileId: profile._id.toString() }
  );

  return { profile, store };
};

// ---------- Get / Update seller profile (null‑safe get) ----------
export const getSellerProfile = async (userId) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  return profile || null;  // <-- null instead of throwing
};

export const updateSellerProfile = async (userId, data) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');

  if (data.phone !== undefined) profile.phone = data.phone;
  if (data.address !== undefined) profile.address = data.address;
  if (data.taxId !== undefined) profile.taxId = data.taxId;

  await profile.save();
  return profile;
};
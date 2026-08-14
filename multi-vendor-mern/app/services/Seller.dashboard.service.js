import SellerProfile from '../models/SellerProfile.model.js';
import Store from '../models/Store.model.js';
import ParentOrder from '../models/ParentOrder.model.js';
import Payment from '../models/Payment.model.js';
import Product from '../models/Product.model.js';
import SellerOrder from '../models/SellerOrder.model.js';
import Shipment from '../models/Shipment.model.js';
import Review from '../models/Review.model.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

const getStoreId = async (userId) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  const store = await Store.findOne({ sellerProfile: profile._id });
  if (!store) throw new ApiError(404, 'Store not found');
  return { profile, store };
};

export const getDashboard = async (userId) => {
  const { store } = await getStoreId(userId);
  const storeId = store._id;

  // ---------- Product metrics ----------
  const totalProducts = await Product.countDocuments({ store: storeId, isDeleted: false });
  const approvedProducts = await Product.countDocuments({
    store: storeId,
    isDeleted: false,
    status: 'Approved',
  });
  const pendingProducts = await Product.countDocuments({
    store: storeId,
    isDeleted: false,
    status: 'PendingApproval',
  });

  // ---------- Date boundaries ----------
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfNextMonth = new Date(startOfMonth);
  startOfNextMonth.setMonth(startOfNextMonth.getMonth() + 1);

  // ---------- Orders ----------
  const todayOrders = await SellerOrder.countDocuments({
    store: storeId,
    createdAt: { $gte: startOfToday },
  });

  const monthlyOrders = await SellerOrder.countDocuments({
    store: storeId,
    createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
  });

  const cancelledOrders = await SellerOrder.countDocuments({
    store: storeId,
    status: 'Cancelled',
  });

  // ---------- Revenue ----------
  const deliveredOrders = await SellerOrder.find({
    store: storeId,
    status: 'Delivered',
  }).select('subTotal');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.subTotal, 0);

  // ---------- Pending shipments (actionable only) ----------
  const actionableStatuses = ['Pending', 'Processing', 'Packed', 'Dispatched', 'OutForDelivery'];
  const actionableSellerOrders = await SellerOrder.find({
    store: storeId,
    status: { $in: actionableStatuses },
  }).select('_id status');

  const actionableOrderIds = actionableSellerOrders.map(so => so._id);

  const shipments = await Shipment.find({ sellerOrder: { $in: actionableOrderIds } });
  const shipmentMap = new Map(shipments.map(s => [s.sellerOrder.toString(), s]));

  let pendingShipments = 0;
  for (const so of actionableSellerOrders) {
    const shipment = shipmentMap.get(so._id.toString());
    if (!shipment || shipment.status === 'Pending') {
      pendingShipments += 1;
    }
  }

  // ---------- Ratings ----------
  const productIds = (await Product.find({ store: storeId, isDeleted: false }).select('_id')).map(p => p._id);
  const avgResult = await Review.aggregate([
    { $match: { product: { $in: productIds } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const averageRating = avgResult[0]?.avg || 0;
  const totalReviews = avgResult[0]?.count || 0;

  return {
    totalProducts,
    approvedProducts,
    pendingProducts,
    todayOrders,
    monthlyOrders,
    totalRevenue,
    pendingShipments,
    cancelledOrders,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
  };
};
// ---------- Seller orders (grouped, sorted newest first) ----------
export const getSellerOrders = async (userId, { page = 1, pageSize = 10 } = {}) => {
  const { store } = await getStoreId(userId);

  const allSellerOrders = await SellerOrder.find({ store: store._id })
    .populate('parentOrder', 'orderStatus totalAmount createdAt customer shippingCity shippingState')
    .populate('store', 'name')                              // ← now we get store name
    .populate('items.product', 'name')
    .lean();

  // Collect parent order IDs
  const parentOrderIds = [...new Set(allSellerOrders.map(so => so.parentOrder?._id))].filter(Boolean);

  // Fetch customer names for all parent orders
  const parentOrders = await ParentOrder.find({ _id: { $in: parentOrderIds } })
    .select('customer shippingCity shippingState')
    .populate('customer', 'name')
    .lean();

  // Map parent order id → customer name + shipping
  const parentMap = {};
  parentOrders.forEach(po => {
    parentMap[po._id.toString()] = {
      customerName: po.customer?.name || 'Unknown Customer',
      shippingLocation: `${po.shippingCity || ''}${po.shippingState ? ', ' + po.shippingState : ''}`.trim() || '—',
    };
  });

  // Fetch payments for all parent orders (to get payment method)
  const payments = await Payment.find({ parentOrder: { $in: parentOrderIds } })
    .select('parentOrder method')
    .lean();
  const paymentMap = {};
  payments.forEach(p => {
    paymentMap[p.parentOrder.toString()] = p.method;
  });

  // Group by parentOrder._id
  const groupedMap = new Map();
  for (const so of allSellerOrders) {
    if (!so.parentOrder) continue;
    const pid = so.parentOrder._id.toString();
    if (!groupedMap.has(pid)) {
      groupedMap.set(pid, {
        _id: so.parentOrder._id,
        orderStatus: so.parentOrder.orderStatus,
        totalAmount: so.parentOrder.totalAmount,
        createdAt: so.parentOrder.createdAt,
        customerName: parentMap[pid]?.customerName || 'Unknown Customer',
        shippingLocation: parentMap[pid]?.shippingLocation || '—',
        paymentMethod: paymentMap[pid] || 'N/A',
        sellerOrders: [],
      });
    }
    // Flatten items across all seller orders for this parent
    const sellerOrdersGroup = groupedMap.get(pid).sellerOrders;
    sellerOrdersGroup.push({
      _id: so._id,
      store: so.store,                   // now populated with { _id, name }
      status: so.status,
      subTotal: so.subTotal,
      items: so.items,
    });
  }

  // Convert to array and sort by createdAt descending (newest first)
  const allGroups = Array.from(groupedMap.values());
  allGroups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const total = allGroups.length;
  const skip = (Number(page) - 1) * Number(pageSize);
  const paginatedGroups = allGroups.slice(skip, skip + Number(pageSize));

  // Fetch shipments for the seller orders in this page
  const sellerOrderIds = paginatedGroups.flatMap(g => g.sellerOrders.map(so => so._id));
  const shipments = await Shipment.find({ sellerOrder: { $in: sellerOrderIds } }).lean();
  const shipmentMap = new Map();
  shipments.forEach(s => shipmentMap.set(s.sellerOrder.toString(), s));

  for (const group of paginatedGroups) {
    for (const so of group.sellerOrders) {
      so.shipment = shipmentMap.get(so._id.toString()) || null;
    }
  }

  return {
    items: paginatedGroups,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / Number(pageSize)),
  };
};

// ---------- Unread orders (new order notifications) ----------
export const getUnreadCount = async (userId) => {
  const { store } = await getStoreId(userId);
  return SellerOrder.countDocuments({ store: store._id, isReadBySeller: false });
};

export const markAllAsRead = async (userId) => {
  const { store } = await getStoreId(userId);
  await SellerOrder.updateMany(
    { store: store._id, isReadBySeller: false },
    { $set: { isReadBySeller: true } }
  );
};

// ---------- Seller reviews (unchanged) ----------
export const getSellerReviews = async (userId, { page = 1, pageSize = 10 } = {}) => {
  const { store } = await getStoreId(userId);
  const productIds = (await Product.find({ store: store._id }).select('_id')).map(p => p._id);

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [reviews, total] = await Promise.all([
    Review.find({ product: { $in: productIds } })
      .populate('customer', 'name')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: { $in: productIds } }),
  ]);

  return {
    items: reviews,
    total,
    page: Number(page),
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
};
export const replyToReview = async (userId, reviewId, replyText) => {
  const { store } = await getStoreId(userId);
  const review = await Review.findById(reviewId).populate('product', 'store');
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.product?.store?.toString() !== store._id.toString()) {
    throw new ApiError(403, 'You can only reply to reviews of your own products');
  }
  review.sellerReply = replyText;
  await review.save();
  return review;
};
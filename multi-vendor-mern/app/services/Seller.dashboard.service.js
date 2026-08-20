import SellerProfile from '../models/SellerProfile.model.js';
import Store from '../models/Store.model.js';
import ParentOrder from '../models/ParentOrder.model.js';
import Payment from '../models/Payment.model.js';
import Product from '../models/Product.model.js';
import SellerOrder from '../models/SellerOrder.model.js';
import Shipment from '../models/Shipment.model.js';
import Review from '../models/Review.model.js';
import ReturnRequest from '../models/Return.model.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

const LOW_STOCK_THRESHOLD = 5;

// ---------- Helper ----------
const getStoreId = async (userId) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  const store = profile
    ? await Store.findOne({ sellerProfile: profile._id })
    : null;
  return { profile, store };
};

const emptyDashboard = () => ({
  totalProducts: 0,
  approvedProducts: 0,
  pendingProducts: 0,
  lowStockCount: 0,
  lowStockProducts: [],
  todayOrders: 0,
  monthlyOrders: 0,
  totalRevenue: 0,
  pendingShipments: 0,
  cancelledOrders: 0,
  averageRating: 0,
  totalReviews: 0,
  totalFulfilledOrders: 0,
  averageOrderValue: 0,
  pendingReviewsCount: 0,
  returnRate: 0,
  topSellingProducts: [],
  salesTrend: [],
});

// ---------- Dashboard stats ----------
export const getDashboard = async (userId) => {
  const { store } = await getStoreId(userId);
  if (!store) return emptyDashboard();

  const storeId = store._id;
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

  const lowStockProducts = await Product.find({
    store: storeId,
    isDeleted: false,
    status: 'Approved',
    stock: { $lte: LOW_STOCK_THRESHOLD },
  })
    .select('_id name stock')
    .sort({ stock: 1 })
    .limit(10)
    .lean();

  const lowStockCount = lowStockProducts.length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfNextMonth = new Date(startOfMonth);
  startOfNextMonth.setMonth(startOfNextMonth.getMonth() + 1);

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

  const deliveredOrders = await SellerOrder.find({
    store: storeId,
    status: 'Delivered',
  }).select('subTotal');

  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.subTotal, 0);

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
    if (!shipment || shipment.status === 'Pending') pendingShipments += 1;
  }

  const productIds = (await Product.find({ store: storeId, isDeleted: false }).select('_id')).map(p => p._id);

  const avgResult = await Review.aggregate([
    { $match: { product: { $in: productIds } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const averageRating = avgResult[0]?.avg || 0;
  const totalReviews = avgResult[0]?.count || 0;

  const totalFulfilledOrders = deliveredOrders.length;
  const averageOrderValue = totalFulfilledOrders > 0
    ? Math.round((totalRevenue / totalFulfilledOrders) * 100) / 100
    : 0;

  const pendingReviewsCount = await Review.countDocuments({
    product: { $in: productIds },
    sellerReply: { $exists: false },
  });

  const deliveredOrderIds = deliveredOrders.map(so => so._id);
  const returnedCount = await ReturnRequest.countDocuments({
    sellerOrder: { $in: deliveredOrderIds },
  });
  const returnRate = totalFulfilledOrders > 0
    ? Math.round((returnedCount / totalFulfilledOrders) * 1000) / 10
    : 0;

  const topSellingProducts = await SellerOrder.aggregate([
    { $match: { store: storeId, status: 'Delivered' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.unitPriceSnapshot', '$items.quantity'] } },
      },
    },
    { $sort: { quantitySold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: '$product.name',
        quantitySold: 1,
        revenue: 1,
      },
    },
  ]);

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const orders = await SellerOrder.find({
      store: storeId,
      createdAt: { $gte: day, $lt: nextDay },
    }).select('subTotal');

    last7Days.push({
      date: day.toISOString().split('T')[0],
      orderCount: orders.length,
      revenue: orders.reduce((sum, o) => sum + o.subTotal, 0),
    });
  }

  return {
    totalProducts,
    approvedProducts,
    pendingProducts,
    lowStockCount,
    lowStockProducts,
    todayOrders,
    monthlyOrders,
    totalRevenue,
    pendingShipments,
    cancelledOrders,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    totalFulfilledOrders,
    averageOrderValue,
    pendingReviewsCount,
    returnRate,
    topSellingProducts,
    salesTrend: last7Days,
  };
};

// ---------- Seller Orders (with payment filter) ----------
export const getSellerOrders = async (userId, { page = 1, pageSize = 10 } = {}) => {
  const { store } = await getStoreId(userId);

  if (!store) {
    return {
      items: [],
      total: 0,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: 0,
    };
  }

  // Fetch all seller orders for this store
  const allSellerOrders = await SellerOrder.find({ store: store._id })
    .populate('parentOrder', 'orderStatus totalAmount createdAt customer shippingCity shippingState')
    .populate('store', 'name')
    .populate('items.product', 'name')
    .lean();

  // Collect parent order IDs
  const parentOrderIds = [...new Set(allSellerOrders.map(so => so.parentOrder?._id))].filter(Boolean);

  // Fetch only payments with status Completed or Refunded
  const payments = await Payment.find({
    parentOrder: { $in: parentOrderIds },
    status: { $in: ['Completed', 'Refunded'] },
  })
    .select('parentOrder method status')
    .lean();

  const paidParentOrderIds = new Set(
    payments.map((p) => p.parentOrder.toString())
  );

  // Keep only seller orders whose parent payment is Completed/Refunded
  const paidSellerOrders = allSellerOrders.filter((so) =>
    paidParentOrderIds.has(so.parentOrder?._id.toString())
  );

  // Fetch parent order details for those paid orders
  const parentOrders = await ParentOrder.find({
    _id: { $in: [...paidParentOrderIds] },
  })
    .select('customer shippingCity shippingState')
    .populate('customer', 'name')
    .lean();

  const parentMap = {};
  parentOrders.forEach((po) => {
    parentMap[po._id.toString()] = {
      customerName: po.customer?.name || 'Unknown Customer',
      shippingLocation: `${po.shippingCity || ''}${po.shippingState ? ', ' + po.shippingState : ''}`.trim() || '—',
    };
  });

  const paymentMap = {};
  payments.forEach((p) => {
    paymentMap[p.parentOrder.toString()] = p;
  });

  // Group seller orders by parent order
  const groupedMap = new Map();

  for (const so of paidSellerOrders) {
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
        paymentMethod: paymentMap[pid]?.method || 'N/A',
        paymentStatus: paymentMap[pid]?.status || 'N/A',
        sellerOrders: [],
      });
    }

    groupedMap.get(pid).sellerOrders.push({
      _id: so._id,
      store: so.store,
      status: so.status,
      subTotal: so.subTotal,
      items: so.items,
    });
  }

  // Sort groups by createdAt (newest first)
  const allGroups = Array.from(groupedMap.values());
  allGroups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Paginate
  const total = allGroups.length;
  const skip = (Number(page) - 1) * Number(pageSize);
  const paginatedGroups = allGroups.slice(skip, skip + Number(pageSize));

  // Fetch shipments for the paginated seller orders
  const sellerOrderIds = paginatedGroups.flatMap((g) =>
    g.sellerOrders.map((so) => so._id)
  );

  const shipments = await Shipment.find({
    sellerOrder: { $in: sellerOrderIds },
  }).lean();

  const shipmentMap = new Map();
  shipments.forEach((s) => shipmentMap.set(s.sellerOrder.toString(), s));

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

// ---------- Unread count (only for paid orders) ----------
export const getUnreadCount = async (userId) => {
  const { store } = await getStoreId(userId);
  if (!store) return 0;

  const sellerOrders = await SellerOrder.find({
    store: store._id,
    isReadBySeller: false,
  }).select('parentOrder');

  const parentOrderIds = sellerOrders.map((so) => so.parentOrder);

  const paidPayments = await Payment.find({
    parentOrder: { $in: parentOrderIds },
    status: { $in: ['Completed', 'Refunded'] },
  }).select('parentOrder');

  const paidParentOrderIds = new Set(
    paidPayments.map((p) => p.parentOrder.toString())
  );

  return sellerOrders.filter((so) =>
    paidParentOrderIds.has(so.parentOrder.toString())
  ).length;
};

// ---------- Mark all as read (only for paid orders) ----------
export const markAllAsRead = async (userId) => {
  const { store } = await getStoreId(userId);
  if (!store) return;

  const sellerOrders = await SellerOrder.find({
    store: store._id,
    isReadBySeller: false,
  }).select('parentOrder');

  const parentOrderIds = sellerOrders.map((so) => so.parentOrder);

  const paidPayments = await Payment.find({
    parentOrder: { $in: parentOrderIds },
    status: { $in: ['Completed', 'Refunded'] },
  }).select('parentOrder');

  const paidParentOrderIds = paidPayments.map((p) => p.parentOrder.toString());

  await SellerOrder.updateMany(
    {
      store: store._id,
      isReadBySeller: false,
      parentOrder: { $in: paidParentOrderIds },
    },
    { $set: { isReadBySeller: true } }
  );
};

// ---------- Reviews ----------
export const getSellerReviews = async (userId, { page = 1, pageSize = 10 } = {}) => {
  const { store } = await getStoreId(userId);
  if (!store) {
    return { items: [], total: 0, page: Number(page), pageSize: Number(pageSize), totalPages: 0 };
  }

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
  if (!store) throw new ApiError(404, 'Seller profile not found');

  const review = await Review.findById(reviewId).populate('product', 'store');
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.product?.store?.toString() !== store._id.toString()) {
    throw new ApiError(403, 'You can only reply to reviews of your own products');
  }
  review.sellerReply = replyText;
  await review.save();
  return review;
};
import SellerProfile from '../models/SellerProfile.model.js';
import Store from '../models/Store.model.js';
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
  const totalProducts = await Product.countDocuments({ store: store._id, isDeleted: false });
  const totalOrders = await SellerOrder.countDocuments({ store: store._id });
  const pendingShipments = await Shipment.countDocuments({
    sellerOrder: { $in: (await SellerOrder.find({ store: store._id }).select('_id')) },
    status: 'Pending',
  });
  const productIds = (await Product.find({ store: store._id }).select('_id')).map(p => p._id);
  const avgResult = await Review.aggregate([
    { $match: { product: { $in: productIds } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const averageRating = avgResult[0]?.avg || 0;
  const totalReviews = avgResult[0]?.count || 0;
  return { totalProducts, totalOrders, pendingShipments, averageRating: Math.round(averageRating * 10) / 10, totalReviews };
};

export const getSellerOrders = async (userId, { page = 1, pageSize = 10 } = {}) => {
  const { store } = await getStoreId(userId);

  // 1. Get all seller orders for this store
  const allSellerOrders = await SellerOrder.find({ store: store._id })
    .populate('parentOrder', 'orderStatus totalAmount createdAt')
    .populate('items.product', 'name')
    .lean();

  // 2. Group by parentOrder to get distinct parent orders
  const groupedMap = new Map();
  for (const so of allSellerOrders) {
    const pid = so.parentOrder._id.toString();
    if (!groupedMap.has(pid)) {
      groupedMap.set(pid, {
        _id: so.parentOrder._id,
        orderStatus: so.parentOrder.orderStatus,
        totalAmount: so.parentOrder.totalAmount,
        createdAt: so.parentOrder.createdAt,
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

  const allGroups = Array.from(groupedMap.values());

  // 3. Apply pagination on the parent orders
  const total = allGroups.length;
  const skip = (Number(page) - 1) * Number(pageSize);
  const paginatedGroups = allGroups.slice(skip, skip + Number(pageSize));

  // 4. Fetch shipments for the seller orders in this page
  const sellerOrderIds = paginatedGroups.flatMap(g => g.sellerOrders.map(so => so._id));
  const shipments = await Shipment.find({ sellerOrder: { $in: sellerOrderIds } }).lean();
  const shipmentMap = new Map();
  shipments.forEach(s => shipmentMap.set(s.sellerOrder.toString(), s));

  // 5. Attach shipments to each seller order
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

export const getSellerReviews = async (userId, { page = 1, pageSize = 10 } = {}) => {
  const { store } = await getStoreId(userId);
  const productIds = (await Product.find({ store: store._id }).select('_id')).map(p => p._id);

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [reviews, total] = await Promise.all([
    Review.find({ product: { $in: productIds } })
      .populate('customer', 'name')
      .populate('product', 'name')
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
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import SellerOrder from '../models/SellerOrder.model.js';
import Shipment from '../models/Shipment.model.js';
import Store from '../models/Store.model.js';
import { ApiError } from '../utils/ApiError.util.js';

// Helper to get the seller's store ID
const getStoreId = async (userId) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  const store = await Store.findOne({ sellerProfile: profile._id });
  if (!store) throw new ApiError(404, 'Store not found');
  return { profile, store };
};

// ---------- Seller profile ----------
export const getProfile = (userId) =>
  sellerProfileRepo.findByUser(userId);

export const createProfile = (userId, data) =>
  sellerProfileRepo.create({ ...data, user: userId });

// ---------- Seller orders ----------
export const getSellerOrders = async (userId) => {
  const { store } = await getStoreId(userId);

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

  const grouped = new Map();
  for (const so of sellerOrders) {
    const pid = so.parentOrder._id.toString();
    if (!grouped.has(pid)) {
      grouped.set(pid, {
        _id: so.parentOrder._id,
        orderStatus: so.parentOrder.orderStatus,
        totalAmount: so.parentOrder.totalAmount,
        createdAt: so.parentOrder.createdAt,
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
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
  // assume one store; get its ID
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
  // average rating
  const productIds = (await Product.find({ store: store._id }).select('_id')).map(p => p._id);
  const avgResult = await Review.aggregate([
    { $match: { product: { $in: productIds } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const averageRating = avgResult[0]?.avg || 0;
  const totalReviews = avgResult[0]?.count || 0;
  return {
    totalProducts,
    totalOrders,
    pendingShipments,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
  };
};

export const getSellerOrders = async (userId) => {
  const { store } = await getStoreId(userId);
  return SellerOrder.find({ store: store._id })
    .populate('parentOrder', 'orderStatus totalAmount')
    .populate('items.product', 'name')
    .sort({ createdAt: -1 });
};

export const getSellerReviews = async (userId) => {
  const { store } = await getStoreId(userId);
  const productIds = (await Product.find({ store: store._id }).select('_id')).map(p => p._id);
  return Review.find({ product: { $in: productIds } })
    .populate('customer', 'name')
    .populate('product', 'name')
    .sort({ createdAt: -1 });
};

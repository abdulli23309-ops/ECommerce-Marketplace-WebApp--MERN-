import ParentOrder from '../models/ParentOrder.model.js';
import SellerOrder from '../models/SellerOrder.model.js';
import Shipment from '../models/Shipment.model.js'; 
import mongoose from 'mongoose';
import * as paymentRepo from './Payment.repository.js';

export const findByCustomer = async (customerId, { page = 1, pageSize = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [orders, total] = await Promise.all([
    ParentOrder.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'sellerOrders',
        populate: { path: 'store', select: 'name city' },
      })
      .lean(),
    ParentOrder.countDocuments({ customer: customerId }),
  ]);

  return {
    items: orders,
    total,
    page: Number(page),
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const findById = async (id, customerId) => {
  const order = await ParentOrder.findOne({
    _id: new mongoose.Types.ObjectId(id),
    customer: new mongoose.Types.ObjectId(customerId),
  })
    .populate({
      path: 'sellerOrders',
      populate: { path: 'store', select: 'name city' },
    })
    .lean();

  if (!order) return null;

  // Attach payment
  const payment = await paymentRepo.findByParentOrder(id);
  if (payment) {
    order.payment = {
      method: payment.method,
      status: payment.status,
    };
  } else {
    order.payment = null;
  }

  // Attach shipment to each seller order
  const sellerOrderIds = (order.sellerOrders || []).map(so => so._id);
  const shipments = await Shipment.find({
    sellerOrder: { $in: sellerOrderIds },
  }).lean();
  const shipmentMap = new Map(shipments.map(s => [s.sellerOrder.toString(), s]));

  for (const so of order.sellerOrders) {
    so.shipment = shipmentMap.get(so._id.toString()) || null;
  }

  return order;
};
export const updateStatus = (id, status) =>
  ParentOrder.findByIdAndUpdate(id, { orderStatus: status }, { new: true });

export const findSellerOrderById = (id) =>
  SellerOrder.findById(id).populate('store');

export const updateSellerOrderStatus = (id, status) =>
  SellerOrder.findByIdAndUpdate(id, { status }, { new: true });

export const findAllSellerOrdersByParentOrder = (parentOrderId) =>
  SellerOrder.find({ parentOrder: parentOrderId });

export const findByIdQuery = (id, session) =>
  ParentOrder.findById(id).session(session);

export const findSellerOrdersByParentQuery = (parentOrderId, session) =>
  SellerOrder.find({ parentOrder: parentOrderId }).session(session);

export const findByIdForMutation = (id, customerId) =>
  ParentOrder.findOne({
    _id: id,
    customer: customerId,
  });
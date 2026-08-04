import ParentOrder from '../models/ParentOrder.model.js';
import SellerOrder from '../models/SellerOrder.model.js';

export const findByCustomer = (customerId) =>
  ParentOrder.find({ customer: customerId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'sellerOrders',
      populate: { path: 'store', select: 'name city' },
    })
    .lean();

export const findById = (id, customerId) =>
  ParentOrder.findOne({ _id: id, customer: customerId })
    .populate({
      path: 'sellerOrders',
      populate: { path: 'store', select: 'name city' },
    })
    .lean();
    
    
    export const updateStatus = (id, status) =>
  ParentOrder.findByIdAndUpdate(id, { orderStatus: status }, { new: true });

    export const findSellerOrderById = (id) =>
  SellerOrder.findById(id).populate('store');

export const updateSellerOrderStatus = (id, status) =>
  SellerOrder.findByIdAndUpdate(id, { status }, { new: true });

export const findAllSellerOrdersByParentOrder = (parentOrderId) =>
  SellerOrder.find({ parentOrder: parentOrderId });

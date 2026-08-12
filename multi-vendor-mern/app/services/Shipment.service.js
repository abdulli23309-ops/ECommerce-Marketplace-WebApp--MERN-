import * as shipmentRepo from '../repositories/Shipment.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import Payment from '../models/Payment.model.js';
import { ApiError } from '../utils/ApiError.util.js';

// Check that the seller order belongs to a store owned by the logged‑in seller
const verifySellerOwnership = async (sellerOrderId, userId) => {
  const sellerOrder = await orderRepo.findSellerOrderById(sellerOrderId);
  if (!sellerOrder) throw new ApiError(404, 'Seller order not found');

  const store = sellerOrder.store;
  if (!store) throw new ApiError(400, 'Seller order has no associated store');

  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) throw new ApiError(403, 'Seller profile not found');

  if (store.sellerProfile.toString() !== profile._id.toString()) {
    throw new ApiError(403, 'You do not own this store');
  }
  return sellerOrder;
};

export const createShipment = async (sellerOrderId, data, userId) => {
  await verifySellerOwnership(sellerOrderId, userId);

  const existing = await shipmentRepo.findBySellerOrder(sellerOrderId);
  if (existing) throw new ApiError(409, 'Shipment already exists for this order');

  const shipment = await shipmentRepo.create({
    sellerOrder: sellerOrderId,
    trackingNumber: data.trackingNumber || null,
    carrier: data.carrier || null,
    estimatedDelivery: data.estimatedDelivery || null,
    status: 'Pending',
    trackingHistory: [{ status: 'Pending', note: 'Shipment created' }],
  });

  await orderRepo.updateSellerOrderStatus(sellerOrderId, 'Processing');
  return shipment;
};

export const updateShipmentStatus = async (shipmentId, status, note, userId) => {
  const shipment = await shipmentRepo.findById(shipmentId);
  if (!shipment) throw new ApiError(404, 'Shipment not found');

  await verifySellerOwnership(shipment.sellerOrder.toString(), userId);

  const updated = await shipmentRepo.updateStatus(shipmentId, status, note || '');

  // Map shipment status to seller order status
  const statusMapping = {
    Pending: 'Pending',
    Packed: 'Packed',
    Dispatched: 'Dispatched',
    OutForDelivery: 'OutForDelivery',
    Delivered: 'Delivered',
  };

  const sellerOrderStatus = statusMapping[status] || null;
  if (sellerOrderStatus) {
    await orderRepo.updateSellerOrderStatus(shipment.sellerOrder, sellerOrderStatus);
  }

  // Propagate to parent order when shipped or delivered
  const sellerOrder = await orderRepo.findSellerOrderById(shipment.sellerOrder);
  const parentOrderId = sellerOrder.parentOrder;

  if (['Dispatched', 'Shipped', 'OutForDelivery'].includes(status)) {
    // Only upgrade parent to Shipped if it's currently Pending or Processing
    const parentOrder = await orderRepo.findById(parentOrderId);
    if (parentOrder && !['Shipped', 'Delivered', 'Cancelled'].includes(parentOrder.status)) {
      await orderRepo.updateStatus(parentOrderId, 'Shipped');
    }
  }

  if (status === 'Delivered') {
    const allSellerOrders = await orderRepo.findAllSellerOrdersByParentOrder(parentOrderId);
    const allDelivered = allSellerOrders.every(so => so.status === 'Delivered');
    if (allDelivered) {
      await orderRepo.updateStatus(parentOrderId, 'Delivered');
    }
    // Mark COD payment as Completed
const payment = await Payment.findOne({ parentOrder: parentOrderId, method: 'CashOnDelivery', status: 'Pending' });
if (payment) {
  payment.status = 'Completed';
  payment.paidAt = new Date();
  await payment.save();
}
  }

  return updated;
};
export const updateShipmentInfo = async (shipmentId, data, userId) => {
  const shipment = await shipmentRepo.findById(shipmentId);
  if (!shipment) throw new ApiError(404, 'Shipment not found');

  await verifySellerOwnership(shipment.sellerOrder.toString(), userId);

  const update = {};
  if (data.carrier !== undefined) update.carrier = data.carrier;
  if (data.trackingNumber !== undefined) update.trackingNumber = data.trackingNumber;

  return shipmentRepo.updateById(shipmentId, update);
};

export const getShipment = async (sellerOrderId, userId) => {
  await verifySellerOwnership(sellerOrderId, userId);
  const shipment = await shipmentRepo.findBySellerOrder(sellerOrderId);
  if (!shipment) throw new ApiError(404, 'Shipment not found');
  return shipment;
};
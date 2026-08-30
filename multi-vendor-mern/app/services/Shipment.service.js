import * as shipmentRepo from '../repositories/Shipment.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import Payment from '../models/Payment.model.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';
import { createNotification } from './Notification.service.js';
import { ApiError } from '../utils/ApiError.util.js';

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

const notifyCustomerForShipment = async (parentOrderId, sellerOrderId, status) => {
  const parentOrder = await orderRepo.findByIdQuery(parentOrderId);

  if (!parentOrder || !parentOrder.customer) {
    return;
  }

  await createNotification(
    parentOrder.customer,
    'shipment',
    'Shipment Updated',
    `Your package status is now ${status}.`,
    `/orders/${parentOrderId}`,
    { sellerOrderId: sellerOrderId.toString(), shipmentStatus: status }
  );
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

  // Notify customer that shipment was created
  const sellerOrder = await orderRepo.findSellerOrderById(sellerOrderId);
  await notifyCustomerForShipment(
    sellerOrder.parentOrder,
    sellerOrderId,
    'Pending'
  );

  return shipment;
};

export const updateShipmentStatus = async (shipmentId, status, note, userId) => {
  const shipment = await shipmentRepo.findById(shipmentId);
  if (!shipment) throw new ApiError(404, 'Shipment not found');

  await verifySellerOwnership(shipment.sellerOrder.toString(), userId);

  const updated = await shipmentRepo.updateStatus(shipmentId, status, note || '');

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

  const sellerOrder = await orderRepo.findSellerOrderById(shipment.sellerOrder);
  const parentOrderId = sellerOrder.parentOrder;

  if (['Dispatched', 'Shipped', 'OutForDelivery'].includes(status)) {
    const parentOrder = await orderRepo.findByIdQuery(parentOrderId);
    if (parentOrder && !['Shipped', 'Delivered', 'Cancelled'].includes(parentOrder.orderStatus)) {
      await orderRepo.updateStatus(parentOrderId, 'Shipped');
    }
  }

  if (status === 'Delivered') {
    const allSellerOrders = await orderRepo.findAllSellerOrdersByParentOrder(parentOrderId);
    const allDelivered = allSellerOrders.every(so => so.status === 'Delivered');
    if (allDelivered) {
      await orderRepo.updateStatus(parentOrderId, 'Delivered');

      // M-012: the COD payment settles only when the WHOLE order has been
      // delivered (cash collected at the door). A partial delivery must not
      // complete the single parent-level payment.
      const payment = await Payment.findOne({
        parentOrder: parentOrderId,
        method: 'CashOnDelivery',
        status: 'Pending',
      });
      if (payment) {
        // Deterministic event id makes the settlement traceable and idempotent —
        // a second delivery transition can never create a duplicate record.
        const settlementEventId = `cod-settlement-${payment._id}`;
        const existingSettlement = await PaymentTransaction.findOne({
          stripeEventId: settlementEventId,
        });
        if (!existingSettlement) {
          payment.status = 'Completed';
          payment.paidAt = new Date();
          await payment.save();

          await PaymentTransaction.create({
            payment: payment._id,
            type: 'success',
            status: 'success',
            amount: payment.amount,
            stripeEventId: settlementEventId,
          });

          const parentOrder = await orderRepo.findByIdQuery(parentOrderId);
          if (parentOrder?.customer) {
            await createNotification(
              parentOrder.customer,
              'payment',
              'Cash payment received',
              `Your cash payment of PKR ${payment.amount} has been collected for order #${parentOrderId}.`,
              `/orders/${parentOrderId}`,
              { parentOrderId: parentOrderId.toString() }
            );
          }
        }
      }
    }
  }

  // Notify customer for every shipment status update
  await notifyCustomerForShipment(parentOrderId, shipment.sellerOrder, status);

  return updated;
};

export const updateShipmentInfo = async (shipmentId, data, userId) => {
  const shipment = await shipmentRepo.findById(shipmentId);
  if (!shipment) throw new ApiError(404, 'Shipment not found');

  await verifySellerOwnership(shipment.sellerOrder.toString(), userId);

  const update = {};
  if (data.carrier !== undefined) update.carrier = data.carrier;
  if (data.trackingNumber !== undefined) update.trackingNumber = data.trackingNumber;

  const updated = await shipmentRepo.updateById(shipmentId, update);

  // Optionally notify customer that tracking details were updated
  const sellerOrder = await orderRepo.findSellerOrderById(shipment.sellerOrder);
  if (sellerOrder?.parentOrder) {
    await notifyCustomerForShipment(
      sellerOrder.parentOrder,
      shipment.sellerOrder,
      'Tracking Updated'
    );
  }

  return updated;
};

export const getShipment = async (sellerOrderId, userId) => {
  await verifySellerOwnership(sellerOrderId, userId);
  const shipment = await shipmentRepo.findBySellerOrder(sellerOrderId);
  if (!shipment) throw new ApiError(404, 'Shipment not found');
  return shipment;
};
import * as returnRepo from '../repositories/Return.repository.js';
import * as orderRepo from '../repositories/Order.repository.js';
import * as sellerProfileRepo from '../repositories/SellerProfile.repository.js';
import * as refundRepo from '../repositories/Refund.repository.js';
import Store from '../models/Store.model.js';
import { createNotification } from './Notification.service.js';
import { ApiError } from '../utils/ApiError.util.js';

// Helper to resolve the authenticated seller's store
const getSellerStore = async (userId) => {
  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  const store = await Store.findOne({ sellerProfile: profile._id });
  if (!store) throw new ApiError(404, 'Store not found');
  return store;
};

export const createReturn = async (customerId, data) => {
  const { productId, sellerOrderId, reason, description, images } = data;

  const sellerOrder = await orderRepo.findSellerOrderById(sellerOrderId);
  if (!sellerOrder) throw new ApiError(404, 'Seller order not found');

  const parentOrder = await orderRepo.findById(sellerOrder.parentOrder, customerId);
  if (!parentOrder) throw new ApiError(404, 'Order not found or not yours');

  if (sellerOrder.status !== 'Delivered') {
    throw new ApiError(400, 'Return is only available for delivered items');
  }

  const itemExists = sellerOrder.items.some(
    (item) => item.product.toString() === productId
  );
  if (!itemExists) throw new ApiError(400, 'Product not found in this order');

  const duplicate = await returnRepo.findDuplicateReturn({
    customerId,
    productId,
    sellerOrderId,
  });

  if (duplicate) {
    throw new ApiError(409, 'A return request already exists for this item');
  }

  const createdReturn = await returnRepo.create({
    customer: customerId,
    product: productId,
    sellerOrder: sellerOrderId,
    reason,
    description,
    images,
  });

  // Notify the customer that their return request was created
  await createNotification(
    customerId,
    'return',
    'Return Request Created',
    'Your return request has been submitted and is under review.',
    `/returns/${createdReturn._id}`,
    { returnRequestId: createdReturn._id }
  );

  return createdReturn;
};

export const getMyReturns = (customerId) => returnRepo.findByCustomer(customerId);

export const processReturn = async (returnId, status, adminId, rejectionReason) => {
  const returnRequest = await returnRepo.findById(returnId);
  if (!returnRequest) throw new ApiError(404, 'Return request not found');
  if (returnRequest.status !== 'Requested') throw new ApiError(400, 'Return already processed');

  const updated = await returnRepo.updateStatus(returnId, status, adminId, rejectionReason);

  // Notify customer of admin decision
  if (returnRequest.customer) {
    const isApproved = status === 'PENDING_SELLER_REVIEW';
    await createNotification(
      returnRequest.customer,
      'return',
      isApproved ? 'Return Approved' : 'Return Rejected',
      isApproved
        ? 'Your return request has been approved and forwarded to the seller.'
        : 'Your return request has been rejected.',
      `/returns/${returnRequest._id}`,
      { returnRequestId: returnRequest._id }
    );
  }

  return updated;
};

export const getAllReturns = (filter = {}) => returnRepo.findAll(filter);

export const getAllReturnsPaginated = (options) =>
  returnRepo.findAllPaginated(options);

export const adminDecision = async (returnId, decision, adminId, notes) => {
  const ret = await returnRepo.findById(returnId);
  if (!ret) throw new ApiError(404, 'Return not found');
  if (!['PENDING_ADMIN_REVIEW', 'Requested'].includes(ret.status)) {
    throw new ApiError(400, 'Invalid state');
  }

  const newStatus = decision === 'APPROVE' ? 'PENDING_SELLER_REVIEW' : 'REJECTED_BY_ADMIN';
  const updated = await returnRepo.updateStatusAndNotes(returnId, newStatus, adminId, notes, 'admin');

  // Notify customer of admin decision
  if (ret.customer) {
    const isApproved = newStatus === 'PENDING_SELLER_REVIEW';
    await createNotification(
      ret.customer,
      'return',
      isApproved ? 'Return Approved' : 'Return Rejected',
      isApproved
        ? 'Your return request has been approved and forwarded to the seller.'
        : 'Your return request has been rejected.',
      `/returns/${ret._id}`,
      { returnRequestId: ret._id }
    );
  }

  return updated;
};

export const getSellerReturns = async (userId) => {
  // Resolve seller's store
  const profile = await sellerProfileRepo.findByUser(userId);
  if (!profile) throw new ApiError(404, 'Seller profile not found');

  const store = await Store.findOne({ sellerProfile: profile._id });
  if (!store) throw new ApiError(404, 'Store not found');

  // Find returns where the product's store matches the seller's store
  return returnRepo.findByStore(store._id);
};

export const sellerDecision = async (returnId, decision, userId, notes) => {
  const ret = await returnRepo.findById(returnId);
  if (!ret) throw new ApiError(404, 'Return not found');

  // Ownership check: verify the return belongs to the requesting seller's store
  const store = await getSellerStore(userId);
  const sellerOrder = await orderRepo.findSellerOrderById(ret.sellerOrder);
  if (!sellerOrder || sellerOrder.store._id.toString() !== store._id.toString()) {
    throw new ApiError(403, 'This return does not belong to your store');
  }

  let newStatus;

  if (decision === 'CONFIRM_RECEIPT') {
    if (ret.status !== 'ITEM_IN_TRANSIT') {
      throw new ApiError(400, 'Return is not in transit');
    }
    newStatus = 'SELLER_RECEIVED';
  } else if (decision === 'APPROVE') {
    if (ret.status !== 'PENDING_SELLER_REVIEW') {
      throw new ApiError(400, 'Return is not awaiting seller review');
    }
    newStatus = 'APPROVED_PENDING_SHIPMENT';
  } else if (decision === 'REJECT') {
    if (ret.status !== 'PENDING_SELLER_REVIEW') {
      throw new ApiError(400, 'Return is not awaiting seller review');
    }
    newStatus = 'REJECTED_BY_SELLER';
  } else {
    throw new ApiError(400, 'Invalid decision');
  }

  const updated = await returnRepo.updateStatusAndNotes(returnId, newStatus, userId, notes, 'seller');

  // Notify customer of seller decision
  if (ret.customer) {
    let title = 'Return Update';
    let message = 'Your return request status has been updated.';

    if (newStatus === 'APPROVED_PENDING_SHIPMENT') {
      title = 'Return Approved';
      message = 'The seller has approved your return. Please ship the item back.';
    } else if (newStatus === 'REJECTED_BY_SELLER') {
      title = 'Return Rejected';
      message = 'The seller has rejected your return request.';
    } else if (newStatus === 'SELLER_RECEIVED') {
      title = 'Return Received';
      message = 'The seller has received your returned item.';
    }

    await createNotification(
      ret.customer,
      'return',
      title,
      message,
      `/returns/${ret._id}`,
      { returnRequestId: ret._id }
    );
  }

  return updated;
};

export const processRefund = async (returnId, userId) => {
  const ret = await returnRepo.findById(returnId);
  if (!ret) throw new ApiError(404, 'Return not found');

  // Ownership check: verify the return belongs to the requesting seller's store
  const store = await getSellerStore(userId);
  const sellerOrder = await orderRepo.findSellerOrderById(ret.sellerOrder);
  if (!sellerOrder || sellerOrder.store._id.toString() !== store._id.toString()) {
    throw new ApiError(403, 'This return does not belong to your store');
  }

  if (ret.status !== 'ITEM_IN_TRANSIT' && ret.status !== 'APPROVED_PENDING_SHIPMENT')
    throw new ApiError(400, 'Invalid state');

  const updated = await returnRepo.updateStatusAndNotes(returnId, 'INSPECTED_AND_REFUNDED', userId, null, 'seller');

  // Notify customer that refund has been initiated/processed
  if (ret.customer) {
    await createNotification(
      ret.customer,
      'refund',
      'Refund Initiated',
      'Your return has been processed and a refund will be issued.',
      `/returns/${ret._id}`,
      { returnRequestId: ret._id }
    );
  }

  return updated;
};

export const updateTracking = async (returnId, userId, trackingNumber) => {
  const ret = await returnRepo.findById(returnId);
  if (!ret) throw new ApiError(404, 'Return not found');
  if (ret.customer.toString() !== userId) throw new ApiError(403, 'Not your return');
  if (ret.status !== 'APPROVED_PENDING_SHIPMENT') throw new ApiError(400, 'Return not awaiting shipment');

  const updated = await returnRepo.updateById(returnId, {
    returnTrackingNumber: trackingNumber,
    status: 'ITEM_IN_TRANSIT',
  });

  // Notify customer that tracking was updated
  await createNotification(
    userId,
    'return',
    'Return Shipped',
    'Your return shipment is now in transit.',
    `/returns/${ret._id}`,
    { returnRequestId: ret._id }
  );

  return updated;
};

export const getMyReturnRefund = async (returnId, userId) => {
  const ret = await returnRepo.findById(returnId);
  if (!ret) throw new ApiError(404, 'Return not found');
  if (ret.customer.toString() !== userId) throw new ApiError(403, 'Not your return');

  const refund = await refundRepo.findByReturnRequest(returnId);
  if (!refund) throw new ApiError(404, 'Refund not found for this return');

  return refund;
};
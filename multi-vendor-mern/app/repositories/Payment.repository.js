import Payment from '../models/Payment.model.js';

export const create = (data, options = {}) => Payment.create(data, options);

export const findByParentOrder = (parentOrderId) =>
  Payment.findOne({ parentOrder: parentOrderId });

export const findById = (id) => Payment.findById(id);

export const updateStatus = (id, status, paidAt = null) =>
  Payment.findByIdAndUpdate(
    id,
    { status, ...(paidAt && { paidAt }) },
    { new: true }
  );

  export const findByStripePaymentIntentId = (stripePaymentIntentId) =>
  Payment.findOne({ stripePaymentIntentId });
  
  export const findByIdWithSession = (id, session) =>
  Payment.findById(id).session(session);

export const findByParentOrderWithSession = (parentOrderId, session) =>
  Payment.findOne({ parentOrder: parentOrderId }).session(session);

export const findByIdQuery = (id, session) =>
  Payment.findById(id).session(session);

export const findByParentOrderQuery = (parentOrderId, session) =>
  Payment.findOne({ parentOrder: parentOrderId }).session(session);
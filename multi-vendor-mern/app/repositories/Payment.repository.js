import Payment from '../models/Payment.model.js';

// Mongoose's Model.create(doc, options) only treats the second argument as
// options when the first argument is an array. Passing a single object plus an
// options object makes Mongoose interpret the options as a *second* document to
// insert, which fails validation. Only forward options for the array form so the
// single-object callers (e.g. the legacy dummy payment) work as intended.
export const create = (data, options = {}) =>
  Array.isArray(data) ? Payment.create(data, options) : Payment.create(data);

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
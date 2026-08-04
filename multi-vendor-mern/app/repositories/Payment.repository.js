import Payment from '../models/Payment.model.js';

export const create = (data) => Payment.create(data);

export const findByParentOrder = (parentOrderId) =>
  Payment.findOne({ parentOrder: parentOrderId });

export const findById = (id) => Payment.findById(id);

export const updateStatus = (id, status, paidAt = null) =>
  Payment.findByIdAndUpdate(
    id,
    { status, ...(paidAt && { paidAt }) },
    { new: true }
  );
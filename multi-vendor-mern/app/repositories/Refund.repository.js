import Refund from '../models/Refund.model.js';

export const create = (data) => Refund.create(data);

export const findByReturnRequest = (returnRequestId) =>
  Refund.findOne({ returnRequest: returnRequestId });

export const findById = (id) => Refund.findById(id);

export const updateStatus = (id, status, processedBy) =>
  Refund.findByIdAndUpdate(
    id,
    { status, processedBy, processedAt: new Date() },
    { new: true }
  );
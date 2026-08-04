import ReturnRequest from '../models/Return.model.js';

export const create = (data) => ReturnRequest.create(data);

export const findByCustomer = (customerId) =>
  ReturnRequest.find({ customer: customerId })
    .populate('product', 'name')
    .sort({ createdAt: -1 });

export const findById = (id) => ReturnRequest.findById(id);

export const updateStatus = (id, status, processedBy, rejectionReason = null) =>
  ReturnRequest.findByIdAndUpdate(
    id,
    {
      status,
      processedBy,
      processedAt: new Date(),
      ...(rejectionReason && { rejectionReason }),
    },
    { new: true }
  );
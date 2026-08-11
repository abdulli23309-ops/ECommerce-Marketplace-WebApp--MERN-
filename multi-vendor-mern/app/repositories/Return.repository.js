import ReturnRequest from '../models/Return.model.js';

export const create = (data) => ReturnRequest.create(data);

export const findByCustomer = (customerId) =>
  ReturnRequest.find({ customer: customerId })
    .populate('product', 'name images')   // ← add 'images'
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
export const findAll = (filter = {}) =>
  ReturnRequest.find(filter)
    .populate('customer', 'name email')
    .populate('product', 'name images')
    .sort({ createdAt: -1 });

export const findByStore = (storeId) =>
  ReturnRequest.find({})
    .populate({
      path: 'product',
      select: 'name images store',
      match: { store: storeId },
    })
    .populate('customer', 'name email')
    .populate('sellerOrder', 'status subTotal')
    .sort({ createdAt: -1 })
    .then((returns) => returns.filter((r) => r.product)); // only returns whose product belongs to this store

export const updateStatusAndNotes = (id, status, processedBy, notes, noteType) => {
  const update = { status, processedBy, processedAt: new Date() };
  if (noteType === 'admin') update.adminNotes = notes;
  if (noteType === 'seller') update.sellerNotes = notes;
  return ReturnRequest.findByIdAndUpdate(id, update, { new: true });
};
export const updateById = (id, update) =>
  ReturnRequest.findByIdAndUpdate(id, update, { new: true });
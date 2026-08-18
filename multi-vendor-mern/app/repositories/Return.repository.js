import ReturnRequest from '../models/Return.model.js';

export const create = (data) => ReturnRequest.create(data);

export const findByCustomer = (customerId) =>
  ReturnRequest.find({ customer: customerId })
    .populate('product', 'name images')
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

export const findAllPaginated = async ({
  page = 1,
  pageSize = 10,
  status,
  statuses = [],
}) => {
  const query = {};

  if (status) {
    query.status = status;
  }

  if (Array.isArray(statuses) && statuses.length > 0) {
    query.status = { $in: statuses };
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [returns, total] = await Promise.all([
    ReturnRequest.find(query)
      .populate('customer', 'name email')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ReturnRequest.countDocuments(query),
  ]);

  return {
    items: returns,
    total,
    page: Number(page),
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
};

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
    .then((returns) => returns.filter((r) => r.product));

export const updateStatusAndNotes = (id, status, processedBy, notes, noteType) => {
  const update = { status, processedBy, processedAt: new Date() };
  if (noteType === 'admin') update.adminNotes = notes;
  if (noteType === 'seller') update.sellerNotes = notes;
  return ReturnRequest.findByIdAndUpdate(id, update, { new: true });
};

export const findDuplicateReturn = ({
  customerId,
  productId,
  sellerOrderId,
}) =>
  ReturnRequest.findOne({
    customer: customerId,
    product: productId,
    sellerOrder: sellerOrderId,
  });

export const updateById = (id, update) =>
  ReturnRequest.findByIdAndUpdate(id, update, { new: true });
import Review from '../models/Review.model.js';

export const create = (data) => Review.create(data);

export const findByProduct = async (productId, { page = 1, pageSize = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [reviews, total] = await Promise.all([
    Review.find({ product: productId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: productId }),
  ]);

  return { items: reviews, total, page: Number(page), pageSize: limit, totalPages: Math.ceil(total / limit) };
};

export const findByCustomer = async (customerId, { page = 1, pageSize = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [reviews, total] = await Promise.all([
    Review.find({ customer: customerId })
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ customer: customerId }),
  ]);

  return { items: reviews, total, page: Number(page), pageSize: limit, totalPages: Math.ceil(total / limit) };
};

export const checkExisting = (customerId, productId, sellerOrderId) =>
  Review.findOne({ customer: customerId, product: productId, sellerOrder: sellerOrderId });

export const findById = (reviewId) =>
  Review.findById(reviewId)
    .populate('product', 'name')
    .populate('customer', 'name');
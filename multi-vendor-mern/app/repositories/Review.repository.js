import Review from '../models/Review.model.js';

export const create = (data) => Review.create(data);

export const findByProduct = (productId) =>
  Review.find({ product: productId })
    .populate('customer', 'name')
    .sort({ createdAt: -1 });

export const findByCustomer = (customerId) =>
  Review.find({ customer: customerId })
    .populate('product', 'name')
    .sort({ createdAt: -1 });

export const checkExisting = (customerId, productId, sellerOrderId) =>
  Review.findOne({
    customer: customerId,
    product: productId,
    sellerOrder: sellerOrderId,
  });
import Product from '../models/Product.model.js';

export const create = (data) => Product.create(data);

export const findById = (id) => Product.findOne({ _id: id, isDeleted: false });

export const findByStore = (storeId, query = {}) =>
  Product.find({ ...query, store: storeId, isDeleted: false });

export const updateById = (id, data) =>
  Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export const softDelete = (id) =>
  Product.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
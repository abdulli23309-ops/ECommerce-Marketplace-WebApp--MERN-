import Category from '../models/Category.model.js';

export const create = (data) => Category.create(data);
export const findAll = () => Category.find({ isDeleted: false });
export const findById = (id) => Category.findOne({ _id: id, isDeleted: false });
export const updateById = (id, data) => Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
export const softDelete = (id) => Category.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
import SubCategory from '../models/SubCategory.model.js';

export const create = (data) => SubCategory.create(data);
export const findAll = () => SubCategory.find({ isDeleted: false }).populate('category', 'name');
export const findById = (id) => SubCategory.findOne({ _id: id, isDeleted: false });
export const updateById = (id, data) => SubCategory.findByIdAndUpdate(id, data, { new: true, runValidators: true });
export const softDelete = (id) => SubCategory.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
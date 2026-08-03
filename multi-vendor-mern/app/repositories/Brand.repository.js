import Brand from '../models/Brand.model.js';

export const create = (data) => Brand.create(data);
export const findAll = () => Brand.find({ isDeleted: false });
export const findById = (id) => Brand.findOne({ _id: id, isDeleted: false });
export const updateById = (id, data) => Brand.findByIdAndUpdate(id, data, { new: true, runValidators: true });
export const softDelete = (id) => Brand.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
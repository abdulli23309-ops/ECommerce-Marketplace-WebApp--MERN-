import Shipment from '../models/Shipment.model.js';

export const create = (data) => Shipment.create(data);

export const findBySellerOrder = (sellerOrderId) =>
  Shipment.findOne({ sellerOrder: sellerOrderId });

export const findById = (id) => Shipment.findById(id);

export const updateStatus = async (id, status, note = '') => {
  const shipment = await Shipment.findById(id);
  if (!shipment) return null;

  shipment.status = status;
  shipment.trackingHistory.push({ status, note });
  return shipment.save();
};

export const updateById = (id, data) =>
  Shipment.findByIdAndUpdate(id, { $set: data }, { new: true });
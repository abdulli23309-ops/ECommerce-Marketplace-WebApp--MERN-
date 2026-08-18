import AdminAuditLog from '../models/AdminAuditLog.model.js';

export const create = (data) => AdminAuditLog.create(data);

export const findAllPaginated = async ({ page = 1, pageSize = 50 } = {}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const [items, total] = await Promise.all([
    AdminAuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(pageSize))
      .populate('actor', 'name email')
      .lean(),
    AdminAuditLog.countDocuments(),
  ]);
  return {
    items,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / Number(pageSize)),
  };
};
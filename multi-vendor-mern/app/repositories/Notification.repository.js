import Notification from '../models/Notification.model.js';

export const create = (data) => Notification.create(data);
export const findByUser = (userId, { page = 1, pageSize = 20 } = {}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  return Promise.all([
    Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(pageSize))
      .lean(),
    Notification.countDocuments({ recipient: userId }),
  ]);
};
export const unreadCount = (userId) =>
  Notification.countDocuments({ recipient: userId, isRead: false });
export const markAsRead = (id, userId) =>
  Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { isRead: true },
    { new: true }
  );
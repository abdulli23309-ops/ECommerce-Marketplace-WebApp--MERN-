import * as notificationRepo from '../repositories/Notification.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const getUserNotifications = async (userId, query) => {
  const [items, total] = await notificationRepo.findByUser(userId, query);
  return {
    items,
    total,
    page: Number(query.page || 1),
    pageSize: Number(query.pageSize || 20),
    totalPages: Math.ceil(total / Number(query.pageSize || 20)),
  };
};

export const getUnreadCount = (userId) => notificationRepo.unreadCount(userId);

export const markAsRead = async (id, userId) => {
  const notification = await notificationRepo.markAsRead(id, userId);
  if (!notification) throw new ApiError(404, 'Notification not found');
  return notification;
};

export const createNotification = (recipientId, type, title, message, link = null, metadata = {}) => {
  return notificationRepo.create({
    recipient: recipientId,
    type,
    title,
    message,
    link,
    metadata,
  });
};
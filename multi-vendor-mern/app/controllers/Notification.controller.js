import * as notificationService from '../services/Notification.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user.id, req.query);
  new ApiResponse(200, result, 'Notifications retrieved').send(res);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user.id);
  new ApiResponse(200, { unreadCount }, 'Unread count retrieved').send(res);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  new ApiResponse(200, notification, 'Notification marked as read').send(res);
});
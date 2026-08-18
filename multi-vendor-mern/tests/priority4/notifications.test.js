import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import Notification from '../../app/models/Notification.model.js';

describe('Notification API (Priority 4)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('returns notifications for the authenticated user', async () => {
    const user = await User.create({
      name: 'Notify User',
      email: `notify-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    await Notification.create({
      recipient: user._id,
      type: 'order',
      title: 'Order Cancelled',
      message: 'Your order has been cancelled.',
      isRead: false,
      link: `/orders/123`,
    });

    const token = generateTestToken({
      sub: user._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].title).toBe('Order Cancelled');
  });

  it('returns the correct unread count', async () => {
    const user = await User.create({
      name: 'Unread User',
      email: `unread-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    await Notification.create([
      {
        recipient: user._id,
        type: 'shipment',
        title: 'Shipped',
        message: 'Your order has shipped.',
        isRead: false,
      },
      {
        recipient: user._id,
        type: 'return',
        title: 'Return Approved',
        message: 'Your return was approved.',
        isRead: true,
      },
    ]);

    const token = generateTestToken({
      sub: user._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.unreadCount).toBe(1);
  });

  it('marks a notification as read', async () => {
    const user = await User.create({
      name: 'Read User',
      email: `read-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    const notification = await Notification.create({
      recipient: user._id,
      type: 'refund',
      title: 'Refund Processed',
      message: 'Your refund was processed.',
      isRead: false,
    });

    const token = generateTestToken({
      sub: user._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .patch(`/api/v1/notifications/${notification._id}/read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.isRead).toBe(true);
  });

  it('rejects unauthenticated notification access', async () => {
    await request(app)
      .get('/api/v1/notifications')
      .expect(401);
  });
});
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import AdminAuditLog from '../../app/models/AdminAuditLog.model.js';

describe('Admin Audit Log API (Priority 4)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('returns paginated audit logs for admin', async () => {
    const admin = await User.create({
      name: 'Audit Admin',
      email: `audit-admin-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Admin',
    });

    await AdminAuditLog.create({
      actor: admin._id,
      action: 'product.moderation',
      entityType: 'Product',
      entityId: new mongoose.Types.ObjectId(),
      metadata: { status: 'Approved' },
    });

    const token = generateTestToken({
      sub: admin._id.toString(),
      roles: ['Admin'],
    });

    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].action).toBe('product.moderation');
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.totalPages).toBe(1);
  });

  it('rejects non-admin users from accessing audit logs', async () => {
    const customer = await User.create({
      name: 'Audit Customer',
      email: `audit-customer-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(res.body.message).toContain('You must be a Admin');
  });
});
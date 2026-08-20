import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import User from '../../app/models/User.model.js';

describe('Priority 5 — Google Authentication', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('creates a new Google user as Customer only', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({
        idToken: 'mock-google-token',
        email: `google-new-${Date.now()}@example.com`,
        name: 'Google New User',
        sub: `google-${Date.now()}`,
        email_verified: true,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('Customer');

    const savedUser = await User.findOne({ email: res.body.data.user.email });
    expect(savedUser.googleId).toBeTruthy();
    expect(savedUser.role).toBe('Customer');
  });

  it('rejects Google token without verified email', async () => {
    await request(app)
      .post('/api/v1/auth/google')
      .send({
        idToken: 'mock-google-token',
        email: `google-invalid-${Date.now()}@example.com`,
        email_verified: false,
        sub: `google-invalid-${Date.now()}`,
      })
      .expect(401);
  });

  it('links Google ID to existing user without changing role', async () => {
    const existingUser = await User.create({
      name: 'Existing User',
      email: `google-existing-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    await request(app)
      .post('/api/v1/auth/google')
      .send({
        idToken: 'mock-google-token',
        email: existingUser.email,
        email_verified: true,
        sub: `google-existing-id-${Date.now()}`,
      })
      .expect(200);

    const updatedUser = await User.findById(existingUser._id);
    expect(updatedUser.googleId).toBeTruthy();
    expect(updatedUser.role).toBe('Seller');
  });
});
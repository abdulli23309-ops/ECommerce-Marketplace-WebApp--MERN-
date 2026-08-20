import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import EmailOtp from '../../app/models/EmailOtp.model.js';

describe('Priority 5 — Email OTP Verification', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('generates an OTP and stores a hash, not plain text', async () => {
    const user = await User.create({
      name: 'OTP User',
      email: `otp-user-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    const token = generateTestToken({ sub: user._id.toString(), roles: ['Customer'] });

    const res = await request(app)
      .post('/api/v1/auth/otp/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: user.email, purpose: 'account_verification' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.emailOtpId).toBeTruthy();

    const record = await EmailOtp.findById(res.body.data.emailOtpId);
    expect(record.otpHash).not.toBeUndefined();
    expect(record.otpHash).not.toBe('');
  });

  it('rejects an incorrect OTP', async () => {
    const user = await User.create({
      name: 'OTP Wrong',
      email: `otp-wrong-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    const token = generateTestToken({ sub: user._id.toString(), roles: ['Customer'] });

    await request(app)
      .post('/api/v1/auth/otp/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: user.email, purpose: 'account_verification' })
      .expect(200);

    const res = await request(app)
      .post('/api/v1/auth/otp/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: user.email, otp: '000000', purpose: 'account_verification' })
      .expect(400);

    expect(res.body.message).toBe('Invalid OTP');
  });

  it('expires an OTP after expiry date', async () => {
    const user = await User.create({
      name: 'OTP Expired',
      email: `otp-expired-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    const token = generateTestToken({ sub: user._id.toString(), roles: ['Customer'] });

    const sendRes = await request(app)
      .post('/api/v1/auth/otp/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: user.email, purpose: 'account_verification' })
      .expect(200);

    await EmailOtp.findByIdAndUpdate(sendRes.body.data.emailOtpId, {
      expiresAt: new Date(Date.now() - 1000),
    });

    const res = await request(app)
      .post('/api/v1/auth/otp/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: user.email, otp: '123456', purpose: 'account_verification' })
      .expect(400);

    expect(res.body.message).toBe('OTP has expired');
  });

  it('limits incorrect verification attempts', async () => {
    const user = await User.create({
      name: 'OTP Attempts',
      email: `otp-attempts-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    const token = generateTestToken({ sub: user._id.toString(), roles: ['Customer'] });

    await request(app)
      .post('/api/v1/auth/otp/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: user.email, purpose: 'account_verification' })
      .expect(200);

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/otp/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: user.email, otp: '000000', purpose: 'account_verification' })
        .expect(400);
    }

    const res = await request(app)
      .post('/api/v1/auth/otp/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: user.email, otp: '000000', purpose: 'account_verification' })
      .expect(400);

    expect(res.body.message).toContain('Too many incorrect attempts');
  });
});
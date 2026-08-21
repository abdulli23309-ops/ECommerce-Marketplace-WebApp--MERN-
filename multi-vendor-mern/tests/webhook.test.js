import request from 'supertest';
import app from '../app/app.js';

// The Stripe webhook is mounted BEFORE the global body parsers with express.raw(),
// and verifies the signature via stripe.webhooks.constructEvent (a local HMAC check,
// no network). With STRIPE_WEBHOOK_SECRET loaded from .env, any request whose
// stripe-signature header does not match the payload is rejected with 400.
describe('Stripe Webhook (POST /api/v1/payments/webhook)', () => {
  it('rejects a webhook payload with an invalid signature (400)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=123,v1=deadbeef')
      .send(JSON.stringify({ id: 'evt_test', type: 'payment_intent.succeeded' }))
      .expect(400);

    expect(res.text).toContain('Webhook signature verification failed');
  });

  it('rejects a webhook with a missing signature header (400)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ id: 'evt_test', type: 'payment_intent.succeeded' }))
      .expect(400);

    expect(res.text).toContain('Webhook signature verification failed');
  });
});

import request from 'supertest';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import app from '../app/app.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';
import Product from '../app/models/Product.model.js';
import Cart from '../app/models/Cart.model.js';
import Address from '../app/models/Address.model.js';
import ParentOrder from '../app/models/ParentOrder.model.js';
import Payment from '../app/models/Payment.model.js';
import PaymentTransaction from '../app/models/PaymentTransaction.model.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helpers to build a valid webhook payload + signature
const makeSignedPayload = (eventType, dataObject) => {
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: eventType,
    data: { object: dataObject },
    created: Math.floor(Date.now() / 1000),
  };
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
  return { payload, signature, event };
};

// Seeds a complete Stripe-pending order ready for webhook finalization
const seedStripePendingOrder = async () => {
  const customer = await User.create({
    name: 'Webhook Customer',
    email: `webhook-cust-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Customer',
    emailVerified: true,
  });
  const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

  const seller = await User.create({
    name: 'Webhook Seller',
    email: `webhook-seller-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Webhook Biz',
    taxId: 'TAX-WEBHOOK',
    phone: '03001234567',
    address: 'Lahore',
  });
  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Webhook Store',
    description: 'A store',
    city: 'Lahore',
  });
  const category = new mongoose.Types.ObjectId();
  const subCategory = new mongoose.Types.ObjectId();

  const product = await Product.create({
    name: 'Webhook Product',
    description: 'A product',
    price: 100,
    stock: 10,
    store: store._id,
    category,
    subCategory,
    status: 'Approved',
  });

  const address = await Address.create({
    user: customer._id,
    fullName: 'John Doe',
    phoneNumber: '03451234567',
    street: '123 Main St',
    city: 'Lahore',
    state: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
  });

  // Create cart
  await Cart.create({
    user: customer._id,
    items: [{ product: product._id, price: 100, quantity: 2 }],
  });

  // Create Stripe payment intent via API (sets up order + payment in Pending)
  const res = await request(app)
    .post('/api/v1/payments/create-intent')
    .set('Authorization', `Bearer ${token}`)
    .send({ addressId: address._id.toString(), paymentMethod: 'Stripe' })
    .expect(200);

  const paymentIntentId = res.body.data.payment.stripePaymentIntentId;
  const parentOrderId = res.body.data.order._id;

  // Fetch the created payment to return its ID for webhook payloads
  const payment = await Payment.findById(res.body.data.payment._id);

  return {
    customer,
    token,
    seller,
    profile,
    store,
    product,
    address,
    parentOrderId,
    paymentIntentId,
    paymentId: payment._id,
    payment,
  };
};

// The Stripe webhook is mounted BEFORE the global body parsers with express.raw(),
// and verifies the signature via stripe.webhooks.constructEvent (a local HMAC check,
// no network). With STRIPE_WEBHOOK_SECRET loaded from .env, any request whose
// stripe-signature header does not match the payload is rejected with 400.
describe('Stripe Webhook (POST /api/v1/payments/webhook)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

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

  // =========== M-002 REGRESSION TESTS ===========

  it('M-002: valid signature + successful processing returns 200 (happy path)', async () => {
    const { paymentIntentId, parentOrderId, paymentId } = await seedStripePendingOrder();

    // Build a valid payment_intent.succeeded event
    const { payload, signature } = makeSignedPayload('payment_intent.succeeded', {
      id: paymentIntentId,
      status: 'succeeded',
    });

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload)
      .expect(200);

    expect(res.body).toEqual({ received: true });

    // Verify side effects: payment completed, order processing, stock deducted, cart cleared
    const dbPayment = await Payment.findById(paymentId).lean();
    expect(dbPayment.status).toBe('Completed');
    expect(dbPayment.paidAt).toBeTruthy();

    const dbOrder = await ParentOrder.findById(parentOrderId).lean();
    expect(dbOrder.orderStatus).toBe('Processing');

    const dbProduct = await Product.findById((await Product.findOne({ name: 'Webhook Product' }))._id).lean();
    expect(dbProduct.stock).toBe(8); // 10 - 2

    const dbCart = await Cart.findOne({ user: (await User.findOne({ email: { $regex: 'webhook-cust' } }))._id }).lean();
    expect(dbCart.items).toHaveLength(0);

    // PaymentTransaction with stripeEventId recorded
    const tx = await PaymentTransaction.findOne({ stripeEventId: JSON.parse(payload).id }).lean();
    expect(tx).toBeTruthy();
    expect(tx.type).toBe('success');
  });

  it('M-002: valid signature + already-processed event (idempotent) returns 200 without re-processing', async () => {
    const { paymentIntentId, parentOrderId, paymentId } = await seedStripePendingOrder();

    const { payload, signature } = makeSignedPayload('payment_intent.succeeded', {
      id: paymentIntentId,
      status: 'succeeded',
    });

    // First delivery
    await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload)
      .expect(200);

    // Record original stock (8 after first processing)
    const product = await Product.findOne({ name: 'Webhook Product' });
    const stockAfterFirst = product.stock;

    // Second delivery of SAME event (duplicate) — should short-circuit without error
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload)
      .expect(200);

    expect(res.body).toEqual({ received: true });

    // Stock should NOT have been decremented again
    const productAfter = await Product.findById(product._id);
    expect(productAfter.stock).toBe(stockAfterFirst);

    // PaymentTransaction still only one for this stripeEventId
    const txCount = await PaymentTransaction.countDocuments({ stripeEventId: JSON.parse(payload).id });
    expect(txCount).toBe(1);
  });

  it('M-002: valid signature + handlePaymentSuccess throws (e.g., DB failure) returns 5xx so Stripe retries', async () => {
    const { paymentIntentId, paymentId } = await seedStripePendingOrder();

    // Build a valid payment_intent.succeeded event
    const { payload, signature } = makeSignedPayload('payment_intent.succeeded', {
      id: paymentIntentId,
      status: 'succeeded',
    });

    // Corrupt the database state so handlePaymentSuccess fails:
    // delete the Payment document so the webhook handler's lookup returns null
    // and then throws when it tries to use the payment object.
    // (handlePaymentSuccess returns early if payment not found, so we need
    // a scenario where it finds the payment but then fails mid-transaction.)
    // The most reliable approach: force a stock-decrement failure by setting
    // product stock to 0 so the atomic $gte guard fails.
    const product = await Product.findOne({ name: 'Webhook Product' });
    await Product.findByIdAndUpdate(product._id, { stock: 0 });

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload)
      .expect(500);

    // MUST NOT be 200 — if it were 200, Stripe would not retry
    expect(res.status).toBe(500);
    expect(res.body.received).toBe(false);
    expect(res.body.error).toBe('Webhook processing failed');

    // Payment should still be Pending (transaction rolled back)
    const dbPayment = await Payment.findById(paymentId).lean();
    expect(dbPayment.status).toBe('Pending');

    // No PaymentTransaction created for this event (rolled back)
    const tx = await PaymentTransaction.findOne({ stripeEventId: JSON.parse(payload).id });
    expect(tx).toBeNull();
  });

  it('M-002: valid signature + payment_failed event returns 200 on success', async () => {
    const { paymentIntentId, parentOrderId, paymentId } = await seedStripePendingOrder();

    const { payload, signature } = makeSignedPayload('payment_intent.payment_failed', {
      id: paymentIntentId,
      status: 'failed',
      last_payment_error: { message: 'Card declined' },
    });

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload)
      .expect(200);

    expect(res.body).toEqual({ received: true });

    const dbPayment = await Payment.findById(paymentId).lean();
    expect(dbPayment.status).toBe('Failed');

    const tx = await PaymentTransaction.findOne({ stripeEventId: JSON.parse(payload).id }).lean();
    expect(tx).toBeTruthy();
    expect(tx.type).toBe('failure');
  });
});

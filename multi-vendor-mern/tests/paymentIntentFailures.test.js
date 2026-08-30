import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Store from '../app/models/Store.model.js';
import Product from '../app/models/Product.model.js';
import Cart from '../app/models/Cart.model.js';
import Address from '../app/models/Address.model.js';
import ParentOrder from '../app/models/ParentOrder.model.js';
import Payment from '../app/models/Payment.model.js';
import PaymentTransaction from '../app/models/PaymentTransaction.model.js';
import { handlePaymentFailure } from '../app/services/Payment.service.js';

// Mock the Stripe SDK so intent creation succeeds/fails deterministically
// without any network access. Applies to the whole module graph of app.js.
const { mockStripeCreate } = vi.hoisted(() => ({ mockStripeCreate: vi.fn() }));
vi.mock('../app/stripe.js', () => ({
  default: { paymentIntents: { create: mockStripeCreate } },
}));

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'intent') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const createCustomer = async () => {
  const customer = await User.create({
    name: 'Intent Customer',
    email: uniqueEmail('customer'),
    password: 'password123',
    role: 'Customer',
    emailVerified: true,
  });
  const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });
  return { customer, token };
};

const seedStoreProduct = async ({ stock = 10 } = {}) => {
  const n = nextUid();
  const seller = await User.create({
    name: `Seller ${n}`,
    email: uniqueEmail('seller'),
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: `Business ${n}`,
    taxId: `TAX-${n}`,
    phone: '03001234567',
    address: 'Lahore',
  });
  const store = await Store.create({
    sellerProfile: profile._id,
    name: `Store ${n}`,
    description: 'A store',
    city: 'Lahore',
  });
  const product = await Product.create({
    name: `Product ${n}`,
    description: 'A product',
    price: 100,
    stock,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
  });
  return { product };
};

const seedCheckoutCart = async ({ stock = 10, quantity = 2 } = {}) => {
  const { customer, token } = await createCustomer();
  const { product } = await seedStoreProduct({ stock });
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
  await Cart.create({
    user: customer._id,
    items: [{ product: product._id, price: 100, quantity }],
  });
  return { customer, token, product, address };
};

const postIntent = (token, addressId) =>
  request(app)
    .post('/api/v1/payments/create-intent')
    .set('Authorization', `Bearer ${token}`)
    .send({ addressId, paymentMethod: 'Stripe' });

describe('Stripe intent failure & duplicate checkout (M-003)', () => {
  beforeEach(async () => {
    await cleanDb();
    mockStripeCreate.mockReset();
  });

  it('cancels the order when Stripe intent creation fails (no orphan Pending order)', async () => {
    const { customer, token, product, address } = await seedCheckoutCart();
    mockStripeCreate.mockRejectedValueOnce(new Error('Stripe is down'));

    const res = await postIntent(token, address._id.toString()).expect(502);
    expect(res.body.message).toBe('Payment processing failed. Please try again.');

    // The order must NOT remain Pending — it is cancelled, freeing the user
    // to start a fresh checkout.
    const order = await ParentOrder.findOne({ customer: customer._id }).lean();
    expect(order).not.toBeNull();
    expect(order.orderStatus).toBe('Cancelled');
    expect(
      await ParentOrder.countDocuments({ customer: customer._id, orderStatus: 'Pending' })
    ).toBe(0);

    // The payment is recorded as Failed with a failure transaction (audit trail).
    const payment = await Payment.findOne({ parentOrder: order._id }).lean();
    expect(payment.status).toBe('Failed');
    expect(
      await PaymentTransaction.countDocuments({ payment: payment._id, type: 'failure' })
    ).toBe(1);

    // No side effects of a completed order: stock untouched, cart kept.
    const freshProduct = await Product.findById(product._id).lean();
    expect(freshProduct.stock).toBe(10);
    const cart = await Cart.findOne({ user: customer._id }).lean();
    expect(cart.items).toHaveLength(1);
  });

  it('successful intent creation still returns the client secret and leaves the order Pending for the webhook', async () => {
    const { customer, token, product, address } = await seedCheckoutCart();
    // StripeProcessor maps the raw Stripe intent (id/client_secret) to
    // { paymentIntentId, clientSecret }, so the mock mimics Stripe's shape.
    mockStripeCreate.mockResolvedValueOnce({
      id: 'pi_test_123',
      client_secret: 'cs_test_123',
    });

    const res = await postIntent(token, address._id.toString()).expect(200);
    expect(res.body.message).toBe('Payment intent created');
    expect(res.body.data.clientSecret).toBe('cs_test_123');

    // Webhook remains the source of truth: order stays Pending until it fires.
    const order = await ParentOrder.findOne({ customer: customer._id }).lean();
    expect(order.orderStatus).toBe('Pending');
    const payment = await Payment.findOne({ parentOrder: order._id }).lean();
    expect(payment.status).toBe('Pending');
    expect(payment.stripePaymentIntentId).toBe('pi_test_123');
    // Success path performs no stock/cart changes itself.
    const freshProduct = await Product.findById(product._id).lean();
    expect(freshProduct.stock).toBe(10);
  });

  it('rejects a repeated checkout with 409 while a previous Stripe checkout is still pending', async () => {
    const { customer, token, address } = await seedCheckoutCart();
    mockStripeCreate.mockResolvedValue({
      id: 'pi_test_dup',
      client_secret: 'cs_test_dup',
    });

    await postIntent(token, address._id.toString()).expect(200);

    const res = await postIntent(token, address._id.toString()).expect(409);
    expect(res.body.message).toBe(
      'You already have a pending order awaiting payment. Complete or cancel it before starting a new checkout.'
    );

    // Only the original order + payment exist — no duplicates were created.
    expect(await ParentOrder.countDocuments({ customer: customer._id })).toBe(1);
    expect(await Payment.countDocuments({})).toBe(1);
  });

  it('allows a new checkout after a webhook-observed payment failure cancels the pending order', async () => {
    const { customer, token, address } = await seedCheckoutCart();
    mockStripeCreate.mockResolvedValue({
      id: 'pi_fail_1',
      client_secret: 'cs_test_retry',
    });

    await postIntent(token, address._id.toString()).expect(200);

    // Stripe reports the payment failed via webhook.
    await handlePaymentFailure({
      id: 'evt_test_1',
      data: {
        object: { id: 'pi_fail_1', last_payment_error: { message: 'card declined' } },
      },
    });

    const order = await ParentOrder.findOne({ customer: customer._id }).lean();
    expect(order.orderStatus).toBe('Cancelled');
    const orderPayment = await Payment.findOne({ parentOrder: order._id }).lean();
    expect(orderPayment.status).toBe('Failed');

    // The failed checkout no longer blocks a fresh attempt.
    mockStripeCreate.mockResolvedValueOnce({
      id: 'pi_retry_2',
      client_secret: 'cs_test_retry2',
    });
    const res = await postIntent(token, address._id.toString()).expect(200);
    expect(res.body.data.clientSecret).toBe('cs_test_retry2');
    expect(await ParentOrder.countDocuments({ customer: customer._id })).toBe(2);
  });
});

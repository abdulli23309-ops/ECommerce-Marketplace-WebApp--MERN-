import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

// Mock the Stripe SDK so intent creation succeeds/fails deterministically
// without any network access. Mirrors the pattern in paymentIntentFailures.test.js.
const { mockStripeCreate } = vi.hoisted(() => ({ mockStripeCreate: vi.fn() }));
vi.mock('../app/stripe.js', () => ({
  default: { paymentIntents: { create: mockStripeCreate } },
}));

let uid = 0;
const nextUid = () => (uid += 1);
const uniqueEmail = (prefix = 'm013') => `${prefix}-${Date.now()}-${nextUid()}@example.com`;

const createCustomer = async () => {
  const customer = await User.create({
    name: 'M013 Customer',
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

describe('M-013: Stripe PaymentIntent currency', () => {
  const originalCurrency = process.env.STRIPE_CURRENCY;

  beforeEach(async () => {
    await cleanDb();
    mockStripeCreate.mockReset();
  });

  afterEach(() => {
    if (originalCurrency === undefined) {
      delete process.env.STRIPE_CURRENCY;
    } else {
      process.env.STRIPE_CURRENCY = originalCurrency;
    }
  });

  it('creates a PaymentIntent with currency "pkr" when STRIPE_CURRENCY is unset', async () => {
    // M-013: the catalog is priced in PKR — the default currency must be pkr,
    // not usd, so charges match the prices customers see.
    delete process.env.STRIPE_CURRENCY;
    const { token, address } = await seedCheckoutCart();
    mockStripeCreate.mockResolvedValueOnce({
      id: 'pi_test_m013_default',
      client_secret: 'cs_test_m013_default',
    });

    const res = await postIntent(token, address._id.toString()).expect(200);
    expect(res.body.message).toBe('Payment intent created');
    expect(res.body.data.clientSecret).toBe('cs_test_m013_default');

    // The currency argument passed to the Stripe SDK must be pkr.
    expect(mockStripeCreate).toHaveBeenCalledTimes(1);
    const intentArgs = mockStripeCreate.mock.calls[0][0];
    expect(intentArgs.currency).toBe('pkr');
  });

  it('respects STRIPE_CURRENCY env override when set to eur', async () => {
    process.env.STRIPE_CURRENCY = 'eur';
    const { token, address } = await seedCheckoutCart();
    mockStripeCreate.mockResolvedValueOnce({
      id: 'pi_test_m013_eur',
      client_secret: 'cs_test_m013_eur',
    });

    await postIntent(token, address._id.toString()).expect(200);

    expect(mockStripeCreate).toHaveBeenCalledTimes(1);
    const intentArgs = mockStripeCreate.mock.calls[0][0];
    expect(intentArgs.currency).toBe('eur');
  });
});
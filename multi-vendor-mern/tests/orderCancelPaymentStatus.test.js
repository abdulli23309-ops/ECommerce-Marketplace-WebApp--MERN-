import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import ParentOrder from '../app/models/ParentOrder.model.js';
import Payment from '../app/models/Payment.model.js';

/**
 * Narrow regression coverage for the pre-existing working-tree change in
 * Order.service.js cancelOrder(): cancelling a *Pending* order whose payment is
 * non-COD and still 'Pending' should mark that payment 'Failed' (the order never
 * actually started paying), while a COD payment must remain 'Pending' — COD is
 * unpaid by design until delivery and must not be converted to Stripe-style
 * 'Failed'. See the cancelled OrderHistoryPage/orderStatus label handling.
 */

const createCustomer = async () => {
  const customer = await User.create({
    name: 'Cancel Payment Customer',
    email: `cancel-pmt-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Customer',
  });
  const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });
  return { customer, token };
};

const createPendingOrder = async (customerId) =>
  ParentOrder.create({
    customer: customerId,
    orderStatus: 'Pending',
    shippingFullName: 'Customer',
    shippingPhone: '03451234567',
    shippingAddressLine1: 'Main Street',
    shippingCity: 'Lahore',
    shippingState: 'Punjab',
    shippingPostalCode: '54000',
    totalAmount: 100,
  });

describe('Order cancellation — payment status handling (pre-existing change)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('marks a non-COD Pending payment as Failed when its Pending order is cancelled', async () => {
    const { customer, token } = await createCustomer();
    const order = await createPendingOrder(customer._id);

    await Payment.create({
      parentOrder: order._id,
      amount: 100,
      method: 'Stripe',
      status: 'Pending',
    });

    await request(app)
      .put(`/api/v1/orders/${order._id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const dbPayment = await Payment.findOne({ parentOrder: order._id }).lean();
    expect(dbPayment.status).toBe('Failed');

    const dbOrder = await ParentOrder.findById(order._id).lean();
    expect(dbOrder.orderStatus).toBe('Cancelled');
  });

  it('leaves a COD Pending payment as Pending when its Pending order is cancelled', async () => {
    const { customer, token } = await createCustomer();
    const order = await createPendingOrder(customer._id);

    await Payment.create({
      parentOrder: order._id,
      amount: 100,
      method: 'CashOnDelivery',
      status: 'Pending',
    });

    await request(app)
      .put(`/api/v1/orders/${order._id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const dbPayment = await Payment.findOne({ parentOrder: order._id }).lean();
    expect(dbPayment.status).toBe('Pending');

    const dbOrder = await ParentOrder.findById(order._id).lean();
    expect(dbOrder.orderStatus).toBe('Cancelled');
  });
});
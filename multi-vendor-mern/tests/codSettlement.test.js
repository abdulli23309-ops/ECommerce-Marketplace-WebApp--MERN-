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
import SellerOrder from '../app/models/SellerOrder.model.js';
import Shipment from '../app/models/Shipment.model.js';
import Notification from '../app/models/Notification.model.js';

let uid = 0;
const nextUid = () => (uid += 1);

const createCustomer = async () => {
  const customer = await User.create({
    name: 'COD Customer',
    email: `cod-cust-${Date.now()}-${nextUid()}@example.com`,
    password: 'password123',
    role: 'Customer',
    emailVerified: true,
  });
  const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });
  return { customer, token };
};

const createSeller = async () => {
  const n = nextUid();
  const seller = await User.create({
    name: `COD Seller ${n}`,
    email: `cod-seller-${Date.now()}-${n}@example.com`,
    password: 'password123',
    role: 'Seller',
  });
  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: `COD Business ${n}`,
    taxId: `TAX-${n}`,
    phone: '03001234567',
    address: 'Lahore',
  });
  const store = await Store.create({
    sellerProfile: profile._id,
    name: `COD Store ${n}`,
    description: 'A store',
    city: 'Lahore',
  });
  const token = generateTestToken({ sub: seller._id.toString(), roles: ['Seller'] });
  return { seller, profile, store, token };
};

const seedProduct = (store, { price = 100, stock = 10 } = {}) =>
  Product.create({
    name: `COD Product ${nextUid()}`,
    description: 'A product',
    price,
    stock,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
  });

const createAddress = (customerId) =>
  Address.create({
    user: customerId,
    fullName: 'COD Buyer',
    phoneNumber: '03451234567',
    street: '1 Cash Lane',
    city: 'Lahore',
    state: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
  });

const codCheckout = async (token, addressId, customerId, items) => {
  await Cart.create({
    user: customerId,
    items: items.map(({ product, quantity = 1 }) => ({
      product: product._id,
      price: product.price,
      quantity,
    })),
  });
  return request(app)
    .post('/api/v1/payments/create-intent')
    .set('Authorization', `Bearer ${token}`)
    .send({ addressId: addressId.toString(), paymentMethod: 'CashOnDelivery' })
    .expect(200);
};

const createShipment = async (token, sellerOrderId) =>
  request(app)
    .post('/api/v1/shipments')
    .set('Authorization', `Bearer ${token}`)
    .send({ sellerOrderId: sellerOrderId.toString() })
    .expect(201);

const updateShipmentStatus = (token, shipmentId, status) =>
  request(app)
    .put(`/api/v1/shipments/${shipmentId}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status });

const getSellerOrders = (parentOrderId) => SellerOrder.find({ parentOrder: parentOrderId });

describe('COD lifecycle & settlement (M-012)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('COD checkout creates Pending ParentOrder + Pending Payment and never falsely completes the payment', async () => {
    const { customer, token } = await createCustomer();
    const { store } = await createSeller();
    const product = await seedProduct(store, { stock: 10 });
    const address = await createAddress(customer._id);

    const res = await codCheckout(token, address._id, customer._id, [{ product, quantity: 2 }]);

    expect(res.body.data.clientSecret).toBeNull();
    const order = await ParentOrder.findById(res.body.data.order._id).lean();
    expect(order.orderStatus).toBe('Pending'); // not Processing/Delivered at checkout
    const payment = await Payment.findOne({ parentOrder: order._id }).lean();
    expect(payment.method).toBe('CashOnDelivery');
    expect(payment.status).toBe('Pending'); // cash not collected yet
    expect(payment.paidAt).toBeNull();

    // No settlement transaction may exist at checkout time.
    expect(
      await PaymentTransaction.countDocuments({ payment: payment._id, type: 'success' })
    ).toBe(0);
  });

  it('seller delivery settles the COD payment with a traceable record and completes the order', async () => {
    const { customer, token: customerToken } = await createCustomer();
    const { store, token: sellerToken } = await createSeller();
    const product = await seedProduct(store, { stock: 5 });
    const address = await createAddress(customer._id);

    const res = await codCheckout(customerToken, address._id, customer._id, [{ product, quantity: 1 }]);
    const parentOrderId = res.body.data.order._id;
    const sellerOrders = await getSellerOrders(parentOrderId);
    expect(sellerOrders).toHaveLength(1);

    await createShipment(sellerToken, sellerOrders[0]._id);
    const shipment = await Shipment.findOne({ sellerOrder: sellerOrders[0]._id });

    const delivery = await updateShipmentStatus(
      sellerToken,
      shipment._id.toString(),
      'Delivered'
    ).expect(200);
    expect(delivery.body.data.status).toBe('Delivered');

    // Payment settled on cash collection…
    const payment = await Payment.findOne({ parentOrder: parentOrderId }).lean();
    expect(payment.status).toBe('Completed');
    expect(payment.paidAt).not.toBeNull();

    // …with a traceable, idempotent settlement transaction record.
    const tx = await PaymentTransaction.findOne({ payment: payment._id, type: 'success' }).lean();
    expect(tx).not.toBeNull();
    expect(tx.stripeEventId).toBe(`cod-settlement-${payment._id}`);
    expect(tx.amount).toBe(payment.amount);

    // Order and seller order advanced by the existing fulfillment machine.
    const dbOrder = await ParentOrder.findById(parentOrderId).lean();
    expect(dbOrder.orderStatus).toBe('Delivered');
    const so = await SellerOrder.findById(sellerOrders[0]._id).lean();
    expect(so.status).toBe('Delivered');

    // Customer is informed that cash was collected.
    const notification = await Notification.findOne({
      recipient: customer._id,
      type: 'payment',
    }).lean();
    expect(notification).not.toBeNull();
  });

  it('settlement cannot happen twice (idempotent)', async () => {
    const { customer, token: customerToken } = await createCustomer();
    const { store, token: sellerToken } = await createSeller();
    const product = await seedProduct(store, { stock: 3 });
    const address = await createAddress(customer._id);

    const res = await codCheckout(customerToken, address._id, customer._id, [{ product, quantity: 1 }]);
    const parentOrderId = res.body.data.order._id;
    const so = (await getSellerOrders(parentOrderId))[0];
    await createShipment(sellerToken, so._id);
    const shipment = await Shipment.findOne({ sellerOrder: so._id });
    const shipmentId = shipment._id.toString();

    await updateShipmentStatus(sellerToken, shipmentId, 'Delivered').expect(200);
    const settled = await Payment.findOne({ parentOrder: parentOrderId }).lean();
    const firstPaidAt = settled.paidAt;

    // A second Delivered transition must be a no-op for the payment.
    await updateShipmentStatus(sellerToken, shipmentId, 'Delivered').expect(200);

    const payment = await Payment.findOne({ parentOrder: parentOrderId }).lean();
    expect(payment.status).toBe('Completed');
    expect(payment.paidAt).toEqual(firstPaidAt);
    expect(await PaymentTransaction.countDocuments({ payment: payment._id, type: 'success' })).toBe(1);
  });

  it('unauthorized users cannot settle a COD payment', async () => {
    const { customer, token: customerToken } = await createCustomer();
    const { profile, store, token: sellerToken } = await createSeller();
    const other = await createSeller();
    const product = await seedProduct(store, { stock: 2 });
    const address = await createAddress(customer._id);

    const res = await codCheckout(customerToken, address._id, customer._id, [{ product, quantity: 1 }]);
    const parentOrderId = res.body.data.order._id;
    const so = (await getSellerOrders(parentOrderId))[0];
    await createShipment(sellerToken, so._id);
    const shipment = await Shipment.findOne({ sellerOrder: so._id });
    const payment = await Payment.findOne({ parentOrder: parentOrderId }).lean();

    // Another seller (not the store owner) cannot touch the shipment.
    await updateShipmentStatus(other.token, shipment._id.toString(), 'Delivered').expect(403);
    // A Customer cannot reach seller shipment routes at all (role gate).
    await updateShipmentStatus(customerToken, shipment._id.toString(), 'Delivered').expect(403);
    // Anonymous requests are rejected.
    await updateShipmentStatus(null, shipment._id.toString(), 'Delivered').expect(401);

    // Nothing settled.
    const after = await Payment.findById(payment._id).lean();
    expect(after.status).toBe('Pending');
    expect(after.paidAt).toBeNull();
    expect(await PaymentTransaction.countDocuments({ payment: payment._id })).toBe(0);
    const dbOrder = await ParentOrder.findById(parentOrderId).lean();
    expect(dbOrder.orderStatus).toBe('Pending');
  });

  it('a multi-store COD order settles only when every seller order is delivered', async () => {
    const { customer, token: customerToken } = await createCustomer();
    const sellerA = await createSeller();
    const sellerB = await createSeller();
    const productA = await seedProduct(sellerA.store, { stock: 5 });
    const productB = await seedProduct(sellerB.store, { stock: 5 });
    const address = await createAddress(customer._id);

    const res = await codCheckout(customerToken, address._id, customer._id, [
      { product: productA, quantity: 1 },
      { product: productB, quantity: 2 },
    ]);
    const parentOrderId = res.body.data.order._id;
    const sellerOrders = await getSellerOrders(parentOrderId);
    expect(sellerOrders).toHaveLength(2);

    const shipmentA = await createShipment(sellerA.token, sellerOrders[0]._id);
    const shipmentB = await createShipment(sellerB.token, sellerOrders[1]._id);

    // First store delivers — payment must NOT settle yet (partial delivery).
    await updateShipmentStatus(sellerA.token, shipmentA.body.data._id.toString(), 'Delivered').expect(200);
    let payment = await Payment.findOne({ parentOrder: parentOrderId }).lean();
    expect(payment.status).toBe('Pending');

    // Second store delivers — the whole order's cash is now collected.
    await updateShipmentStatus(sellerB.token, shipmentB.body.data._id.toString(), 'Delivered').expect(200);
    payment = await Payment.findOne({ parentOrder: parentOrderId }).lean();
    expect(payment.status).toBe('Completed');
    expect(await PaymentTransaction.countDocuments({ payment: payment._id, type: 'success' })).toBe(1);

    const dbOrder = await ParentOrder.findById(parentOrderId).lean();
    expect(dbOrder.orderStatus).toBe('Delivered');
  });

  it('delivery settlement never touches non-COD (Stripe) payments', async () => {
    const { customer, token: customerToken } = await createCustomer();
    const { profile, store, token: sellerToken } = await createSeller();
    const product = await seedProduct(store, { stock: 4 });
    const address = await createAddress(customer._id);

    const res = await codCheckout(customerToken, address._id, customer._id, [{ product, quantity: 1 }]);
    const parentOrderId = res.body.data.order._id;

    // Simulate the Stripe flow state: the parent payment is a Pending Stripe payment.
    await Payment.updateOne(
      { parentOrder: parentOrderId },
      { method: 'Stripe', stripePaymentIntentId: 'pi_cod_test' }
    );
    await ParentOrder.updateOne({ _id: parentOrderId }, { orderStatus: 'Processing' });

    const so = (await getSellerOrders(parentOrderId))[0];
    await createShipment(sellerToken, so._id);
    const shipment = await Shipment.findOne({ sellerOrder: so._id });
    await updateShipmentStatus(sellerToken, shipment._id.toString(), 'Delivered').expect(200);

    // Stripe payments are settled ONLY by the webhook — never by delivery.
    const payment = await Payment.findOne({ parentOrder: parentOrderId }).lean();
    expect(payment.method).toBe('Stripe');
    expect(payment.status).toBe('Pending');
    expect(await PaymentTransaction.countDocuments({ payment: payment._id })).toBe(0);
  });
});

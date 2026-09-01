import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app/app.js';
import { cleanDb } from './helpers/testDb.js';
import { generateTestToken } from './helpers/auth.js';
import User from '../app/models/User.model.js';
import Address from '../app/models/Address.model.js';
import Store from '../app/models/Store.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Product from '../app/models/Product.model.js';
import ParentOrder from '../app/models/ParentOrder.model.js';
import SellerOrder from '../app/models/SellerOrder.model.js';


const seedReturnData = async () => {
  const customer = await User.create({
    name: 'Return Customer',
    email: `return-customer-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Customer',
  });

  const seller = await User.create({
    name: 'Return Seller',
    email: `return-seller-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Seller',
  });

  const profile = await SellerProfile.create({
    user: seller._id,
    status: 'Approved',
    businessName: 'Return Store',
    taxId: '123',
    phone: '03001234567',
    address: 'Return Address',
  });

  const store = await Store.create({
    sellerProfile: profile._id,
    name: 'Return Store',
    description: 'Return store',
    city: 'Lahore',
  });

  const product = await Product.create({
    name: 'Returnable Product',
    description: 'Product description',
    price: 500,
    stock: 5,
    store: store._id,
    category: new mongoose.Types.ObjectId(),
    subCategory: new mongoose.Types.ObjectId(),
    status: 'Approved',
  });

  const parentOrder = await ParentOrder.create({
    customer: customer._id,
    orderStatus: 'Delivered',
    shippingFullName: 'Return Customer',
    shippingPhone: '03451234567',
    shippingAddressLine1: 'Main Street',
    shippingCity: 'Lahore',
    shippingState: 'Punjab',
    shippingPostalCode: '54000',
    totalAmount: 500,
  });

  const sellerOrder = await SellerOrder.create({
    parentOrder: parentOrder._id,
    store: store._id,
    subTotal: 500,
    status: 'Delivered',
    deliveredAt: new Date(),
    items: [
      {
        product: product._id,
        productNameSnapshot: 'Returnable Product',
        unitPriceSnapshot: 500,
        quantity: 1,
      },
    ],
  });

  return { customer, seller, store, product, sellerOrder, parentOrder };
};

describe('Return API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('allows customer to create a return for a delivered seller order', async () => {
    const { customer, product, sellerOrder } = await seedReturnData();

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sellerOrderId: sellerOrder._id.toString(),
        productId: product._id.toString(),
        reason: 'Item is defective/broken',
        description: 'Does not work',
        images: [],
      })
      .expect(201);

    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.status).toBe('PENDING_ADMIN_REVIEW');
  });

  it('rejects duplicate return request', async () => {
    const { customer, product, sellerOrder } = await seedReturnData();

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const payload = {
      sellerOrderId: sellerOrder._id.toString(),
      productId: product._id.toString(),
      reason: 'Item is defective/broken',
      description: 'Does not work',
      images: [],
    };

    await request(app)
      .post('/api/v1/returns')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const res = await request(app)
      .post('/api/v1/returns')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(409);

    expect(res.body.message).toBeTruthy();
  });

  it('rejects unauthorized seller action on another seller return', async () => {
    const { customer, product, sellerOrder } = await seedReturnData();

    const customerToken = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const createRes = await request(app)
      .post('/api/v1/returns')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        sellerOrderId: sellerOrder._id.toString(),
        productId: product._id.toString(),
        reason: 'Item is defective/broken',
        description: 'Does not work',
        images: [],
      })
      .expect(201);

    const returnId = createRes.body.data._id;

    const otherSeller = await User.create({
      name: 'Other Seller',
      email: `other-seller-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const otherProfile = await SellerProfile.create({
      user: otherSeller._id,
      status: 'Approved',
      businessName: 'Other Store',
      taxId: '999',
      phone: '03001234567',
      address: 'Other Address',
    });

    await Store.create({
      sellerProfile: otherProfile._id,
      name: 'Other Store',
      description: 'Other store',
      city: 'Karachi',
    });

    const otherSellerToken = generateTestToken({
      sub: otherSeller._id.toString(),
      roles: ['Seller'],
    });

    const res = await request(app)
      .put(`/api/v1/returns/${returnId}/seller-decision`)
      .set('Authorization', `Bearer ${otherSellerToken}`)
      .send({ decision: 'APPROVE' })
      .expect(403);

    expect(res.body.message).toContain('This return does not belong to your store');
  });

  it('handles item quantity selection and calculates refund amount accurately', async () => {
    const customer = await User.create({
      name: 'Return Qty Customer',
      email: `return-qty-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
    });

    const seller = await User.create({
      name: 'Return Qty Seller',
      email: `return-seller-qty-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const profile = await SellerProfile.create({
      user: seller._id,
      status: 'Approved',
      businessName: 'Qty Return Store',
      taxId: '1234',
      phone: '03001234567',
      address: 'Return Address',
    });

    const store = await Store.create({
      sellerProfile: profile._id,
      name: 'Qty Return Store',
      description: 'Store',
      city: 'Lahore',
    });

    const productA = await Product.create({
      name: 'Product A',
      description: 'Description A',
      price: 200,
      stock: 10,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    const productB = await Product.create({
      name: 'Product B',
      description: 'Description B',
      price: 350,
      stock: 10,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });

    const parentOrder = await ParentOrder.create({
      customer: customer._id,
      orderStatus: 'Delivered',
      shippingFullName: 'Return Qty Customer',
      shippingPhone: '03451234567',
      shippingAddressLine1: 'Main Street',
      shippingCity: 'Lahore',
      totalAmount: 1300,
    });

    const sellerOrder = await SellerOrder.create({
      parentOrder: parentOrder._id,
      store: store._id,
      subTotal: 1300,
      status: 'Delivered',
      items: [
        {
          product: productA._id,
          productNameSnapshot: productA.name,
          unitPriceSnapshot: productA.price, // 200
          quantity: 3, // purchased 3
        },
        {
          product: productB._id,
          productNameSnapshot: productB.name,
          unitPriceSnapshot: productB.price, // 350
          quantity: 2, // purchased 2
        },
      ],
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    // Returning 2 units of Product A (price 200 each => 400 refund)
    const returnResA = await request(app)
      .post('/api/v1/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sellerOrderId: sellerOrder._id.toString(),
        productId: productA._id.toString(),
        quantity: 2,
        reason: 'Item is defective/broken',
      })
      .expect(201);

    expect(returnResA.body.data.quantity).toBe(2);
    expect(returnResA.body.data.refundAmount).toBe(400);

    // Reject invalid quantity exceeding purchased quantity (before the
    // duplicate guard consumes the package)
    const invalidQtyRes = await request(app)
      .post('/api/v1/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sellerOrderId: sellerOrder._id.toString(),
        productId: productB._id.toString(),
        quantity: 99,
        reason: 'Wrong item received',
      })
      .expect(400);

    expect(invalidQtyRes.body.message).toContain('Return quantity must be between 1 and 2');

    // A second return for the same seller order (different product) is
    // rejected — one return per package, ever.
    const returnResB = await request(app)
      .post('/api/v1/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sellerOrderId: sellerOrder._id.toString(),
        productId: productB._id.toString(),
        quantity: 1,
        reason: 'Wrong item received',
      })
      .expect(409);

    expect(returnResB.body.message).toContain('already exists');
  });

  it('rejects return request after the 4-day return window has closed', async () => {
    const { customer, product, sellerOrder } = await seedReturnData();

    // Simulate a delivery that happened 5 days ago
    await SellerOrder.findByIdAndUpdate(sellerOrder._id, {
      deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const res = await request(app)
      .post('/api/v1/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sellerOrderId: sellerOrder._id.toString(),
        productId: product._id.toString(),
        reason: 'Item is defective/broken',
        images: [],
      })
      .expect(400);

    expect(res.body.message).toContain('return window has closed');
  });

  it('allows return request within the 4-day return window and exposes returnInfo on order detail', async () => {
    const { customer, product, sellerOrder, parentOrder } = await seedReturnData();

    // Delivered 2 days ago — inside the window
    await SellerOrder.findByIdAndUpdate(sellerOrder._id, {
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    const token = generateTestToken({
      sub: customer._id.toString(),
      roles: ['Customer'],
    });

    const createRes = await request(app)
      .post('/api/v1/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sellerOrderId: sellerOrder._id.toString(),
        productId: product._id.toString(),
        reason: 'Item is defective/broken',
        images: [],
      })
      .expect(201);

    expect(createRes.body.data.status).toBe('PENDING_ADMIN_REVIEW');

    // Order detail contract: existing return is reported so the UI hides
    // "Request Return" and shows "View Return" instead.
    const orderRes = await request(app)
      .get(`/api/v1/orders/${parentOrder._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const enriched = orderRes.body.data.sellerOrders.find(
      (so) => so._id === sellerOrder._id.toString()
    );
    expect(enriched.returnInfo.exists).toBe(true);
    expect(enriched.returnInfo.status).toBe('PENDING_ADMIN_REVIEW');
    expect(enriched.returnInfo.canRequestReturn).toBe(false);
    expect(enriched.returnInfo.returnWindowDays).toBe(4);
  });
});
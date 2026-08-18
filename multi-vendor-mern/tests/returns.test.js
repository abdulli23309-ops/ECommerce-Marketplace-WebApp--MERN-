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
    items: [
      {
        product: product._id,
        productNameSnapshot: 'Returnable Product',
        unitPriceSnapshot: 500,
        quantity: 1,
      },
    ],
  });

  return { customer, seller, store, product, sellerOrder };
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
});
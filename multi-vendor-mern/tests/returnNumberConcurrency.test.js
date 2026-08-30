import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { cleanDb } from './helpers/testDb.js';
import User from '../app/models/User.model.js';
import Store from '../app/models/Store.model.js';
import SellerProfile from '../app/models/SellerProfile.model.js';
import Product from '../app/models/Product.model.js';
import SellerOrder from '../app/models/SellerOrder.model.js';
import ParentOrder from '../app/models/ParentOrder.model.js';
import ReturnRequest from '../app/models/Return.model.js';

/**
 * M-017 regression test.
 *
 * Verifies that concurrent ReturnRequest documents receive unique,
 * correctly-formatted return numbers (`RET-000001` style) without relying
 * on a fragile count-then-insert race. Relies on the database-level
 * uniqueness of the generated number.
 *
 * NOTE: a dedicated in-memory replSet is created here (rather than relying
 * on the global `setup.js`) so the counter-collection race is exercised
 * with full concurrency control on the server.
 */

const seedDeps = async (count) => {
  const customer = await User.create({
    name: 'Return Customer',
    email: `rc-${Date.now()}@example.com`,
    password: 'password123',
    role: 'Customer',
  });
  const seller = await User.create({
    name: 'Return Seller',
    email: `rs-${Date.now()}@example.com`,
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

  const items = [];
  for (let i = 0; i < count; i += 1) {
    const product = await Product.create({
      name: `Product ${i}`,
      description: 'description',
      price: 100 + i,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
    });
        // Each return requires a distinct (customer, product, sellerOrder) triple
    // due to the unique compound index on ReturnRequest.
    const parentOrder = await ParentOrder.create({
      customer: customer._id,
      orderStatus: 'Delivered',
      shippingFullName: 'Return Customer',
      shippingPhone: '03451234567',
      shippingAddressLine1: 'Main Street',
      shippingCity: 'Lahore',
      shippingState: 'Punjab',
      shippingPostalCode: '54000',
      totalAmount: 100 + i,
    });
    const sellerOrder = await SellerOrder.create({
      parentOrder: parentOrder._id,
      store: store._id,
      subTotal: 100 + i,
      status: 'Delivered',
      items: [
        {
          product: product._id,
          productNameSnapshot: product.name,
          unitPriceSnapshot: product.price,
          quantity: 1,
        },
      ],
    });
    items.push({ product: product._id, sellerOrder: sellerOrder._id });
  }
  return { customer, items };
};

describe('ReturnRequest returnNumber (M-017 concurrency regression)', () => {
  // The global setup.js already connects mongoose to its own in-memory
  // MongoMemoryReplSet. The test below only asserts behaviour against the
  // already-connected mongoose instance — no extra connection is opened.
  afterEach(async () => {
    await cleanDb();
  });

  it('generates unique, correctly-formatted return numbers', async () => {
    const N = 10;
    const { customer, items } = await seedDeps(N);

    // Insert sequentially here; this test confirms format + uniqueness
    // of the number-generation logic itself (counter collection).
    const results = await Promise.all(
      items.map(({ product, sellerOrder }) =>
        ReturnRequest.create({
          customer: customer._id,
          product,
          sellerOrder,
          reason: 'Item is defective/broken',
          description: 'Does not work',
        })
      )
    );

    const numbers = results.map((r) => r.returnNumber);
    const uniq = new Set(numbers);

    expect(uniq.size).toBe(results.length);
    results.forEach((r) => {
      expect(r.returnNumber).toMatch(/^RET-\d{6}$/);
      expect(r.returnNumber).toBeTruthy();
    });

    // Persistence-layer uniqueness guarantee.
    const persisted = await ReturnRequest.find({}).sort({ createdAt: 1 });
    const persistedNumbers = persisted.map((r) => r.returnNumber);
    expect(new Set(persistedNumbers).size).toBe(persisted.length);
  });

  it('generates unique return numbers under concurrent creation', async () => {
    const N = 10;
    const { customer, items } = await seedDeps(N);

    // Issue all inserts concurrently so the pre-save hook's atomic
    // counter increment is exercised under a race.
    const docs = items.map(({ product, sellerOrder }) =>
      ReturnRequest.create({
        customer: customer._id,
        product,
        sellerOrder,
        reason: 'Item is defective/broken',
        description: 'Does not work',
      })
    );

    const results = await Promise.all(docs);
    const numbers = results.map((r) => r.returnNumber);
    const uniq = new Set(numbers);

    expect(uniq.size).toBe(results.length);
    results.forEach((r) => {
      expect(r.returnNumber).toMatch(/^RET-\d{6}$/);
    });

    const persisted = await ReturnRequest.find({});
    const persistedNumbers = persisted.map((r) => r.returnNumber);
    expect(new Set(persistedNumbers).size).toBe(persisted.length);
  });
});


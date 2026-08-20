import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app/app.js';
import { cleanDb } from '../helpers/testDb.js';
import { generateTestToken } from '../helpers/auth.js';
import User from '../../app/models/User.model.js';
import SellerProfile from '../../app/models/SellerProfile.model.js';
import Store from '../../app/models/Store.model.js';
import Product from '../../app/models/Product.model.js';
import DeliveryCharge from '../../app/models/DeliveryCharge.model.js';
import Cart from '../../app/models/Cart.model.js';
import Address from '../../app/models/Address.model.js';
import Coupon from '../../app/models/Coupon.model.js';

describe('Priority 5 — Delivery Charges', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('adds delivery charge to parent order for non-free delivery product', async () => {
    const customer = await User.create({
      name: 'Delivery Customer',
      email: `delivery-customer-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
      emailVerified: true,
    });

    const seller = await User.create({
      name: 'Delivery Seller',
      email: `delivery-seller-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const profile = await SellerProfile.create({
      user: seller._id,
      status: 'Approved',
      businessName: 'Delivery Store',
      taxId: '123',
      phone: '03001234567',
      address: 'Lahore',
    });

    const store = await Store.create({
      sellerProfile: profile._id,
      name: 'Delivery Store',
      description: 'Delivery store',
      city: 'Lahore',
    });

    await DeliveryCharge.create({
      sellerProfile: profile._id,
      baseCharge: 200,
      isActive: true,
    });

    const product = await Product.create({
      name: 'Paid Delivery Product',
      description: 'Product',
      price: 1000,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
      freeDelivery: false,
    });

    const address = await Address.create({
      user: customer._id,
      fullName: 'Customer',
      phoneNumber: '03451234567',
      street: 'Street',
      city: 'Lahore',
      state: 'Punjab',
      postalCode: '54000',
      country: 'Pakistan',
    });

    await Cart.create({
      user: customer._id,
      items: [{ product: product._id, quantity: 1, price: product.price }],
    });

    const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString() })
      .expect(201);

    expect(res.body.data.subtotal).toBe(1000);
    expect(res.body.data.deliveryCharges).toBe(200);
    expect(res.body.data.totalAmount).toBe(1200);
  });

  it('does not charge delivery for seller-provided free delivery product', async () => {
    const customer = await User.create({
      name: 'Free Customer',
      email: `free-customer-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
      emailVerified: true,
    });

    const seller = await User.create({
      name: 'Free Seller',
      email: `free-seller-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const profile = await SellerProfile.create({
      user: seller._id,
      status: 'Approved',
      businessName: 'Free Delivery Store',
      taxId: '123',
      phone: '03001234567',
      address: 'Lahore',
    });

    const store = await Store.create({
      sellerProfile: profile._id,
      name: 'Free Delivery Store',
      description: 'Store',
      city: 'Lahore',
    });

    await DeliveryCharge.create({
      sellerProfile: profile._id,
      baseCharge: 200,
      isActive: true,
    });

    const product = await Product.create({
      name: 'Free Delivery Product',
      description: 'Product',
      price: 1000,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
      freeDelivery: true,
    });

    const address = await Address.create({
      user: customer._id,
      fullName: 'Customer',
      phoneNumber: '03451234567',
      street: 'Street',
      city: 'Lahore',
      state: 'Punjab',
      postalCode: '54000',
      country: 'Pakistan',
    });

    await Cart.create({
      user: customer._id,
      items: [{ product: product._id, quantity: 1, price: product.price }],
    });

    const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString() })
      .expect(201);

    expect(res.body.data.deliveryCharges).toBe(0);
    expect(res.body.data.totalAmount).toBe(1000);
  });

  it('applies free_delivery coupon to remove delivery charges', async () => {
    const customer = await User.create({
      name: 'Coupon Delivery Customer',
      email: `coupon-delivery-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Customer',
      emailVerified: true,
    });

    const seller = await User.create({
      name: 'Coupon Delivery Seller',
      email: `coupon-delivery-seller-${Date.now()}@example.com`,
      password: 'password123',
      role: 'Seller',
    });

    const profile = await SellerProfile.create({
      user: seller._id,
      status: 'Approved',
      businessName: 'Coupon Delivery Store',
      taxId: '123',
      phone: '03001234567',
      address: 'Lahore',
    });

    const store = await Store.create({
      sellerProfile: profile._id,
      name: 'Coupon Delivery Store',
      description: 'Store',
      city: 'Lahore',
    });

    await DeliveryCharge.create({
      sellerProfile: profile._id,
      baseCharge: 200,
      isActive: true,
    });

    const product = await Product.create({
      name: 'Paid Product',
      description: 'Product',
      price: 1000,
      stock: 5,
      store: store._id,
      category: new mongoose.Types.ObjectId(),
      subCategory: new mongoose.Types.ObjectId(),
      status: 'Approved',
      freeDelivery: false,
    });

    await Coupon.create({
      code: 'FREESHIP',
      discountType: 'free_delivery',
      discountValue: 0,
      minOrderAmount: 0,
      startsAt: new Date(Date.now() - 1000),
      expiresAt: new Date(Date.now() + 86400000),
      usageLimit: null,
      usageCount: 0,
      isActive: true,
    });

    const address = await Address.create({
      user: customer._id,
      fullName: 'Customer',
      phoneNumber: '03451234567',
      street: 'Street',
      city: 'Lahore',
      state: 'Punjab',
      postalCode: '54000',
      country: 'Pakistan',
    });

    await Cart.create({
      user: customer._id,
      items: [{ product: product._id, quantity: 1, price: product.price }],
    });

    const token = generateTestToken({ sub: customer._id.toString(), roles: ['Customer'] });

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: address._id.toString(), couponCode: 'FREESHIP' })
      .expect(201);

    expect(res.body.data.deliveryCharges).toBe(200);
    expect(res.body.data.freeDeliveryDiscount).toBe(200);
    expect(res.body.data.totalAmount).toBe(1000);
  });
});
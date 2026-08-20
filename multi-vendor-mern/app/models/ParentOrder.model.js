import mongoose from 'mongoose';

const parentOrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    shippingFullName: {
      type: String,
      required: true,
    },
    shippingPhone: {
      type: String,
      required: true,
    },
    shippingAddressLine1: {
      type: String,
      required: true,
    },
    shippingAddressLine2: {
      type: String,
      default: '',
    },
    shippingCity: {
      type: String,
      required: true,
    },
    shippingState: {
      type: String,
      default: '',
    },
    shippingPostalCode: {
      type: String,
      default: '',
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    deliveryCharges: {
      type: Number,
      default: 0,
    },
    freeDeliveryDiscount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

parentOrderSchema.virtual('sellerOrders', {
  ref: 'SellerOrder',
  localField: '_id',
  foreignField: 'parentOrder',
});

const ParentOrder = mongoose.model('ParentOrder', parentOrderSchema);

export default ParentOrder;
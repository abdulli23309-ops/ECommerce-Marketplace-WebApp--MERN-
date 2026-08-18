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
      default: 'Pending',
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    },
    // multi-vendor-mern/app/models/ParentOrder.model.js
subtotal: {
  type: Number,
  default: 0,
},
discountAmount: {
  type: Number,
  default: 0,
},
couponCode: {
  type: String,
  default: null,
},
    shippingFullName: { type: String, required: true },
    shippingPhone: { type: String, required: true },
    shippingAddressLine1: { type: String, required: true },
    shippingAddressLine2: { type: String, default: null },
    shippingCity: { type: String, required: true },
    shippingState: { type: String, default: null },
    shippingPostalCode: { type: String, default: null },
    totalAmount: { type: Number, required: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);
parentOrderSchema.virtual('sellerOrders', {
  ref: 'SellerOrder',
  localField: '_id',
  foreignField: 'parentOrder',
});
const ParentOrder = mongoose.model('ParentOrder', parentOrderSchema);
export default ParentOrder;
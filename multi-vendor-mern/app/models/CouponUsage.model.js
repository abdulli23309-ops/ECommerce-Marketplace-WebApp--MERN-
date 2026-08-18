import mongoose from 'mongoose';

const couponUsageSchema = new mongoose.Schema(
  {
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentOrder', required: true },
    discountAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);
export default CouponUsage;
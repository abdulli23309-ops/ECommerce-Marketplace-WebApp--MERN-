import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
   discountType: {
  type: String,
  enum: ['percentage', 'fixed', 'free_delivery'],
  required: true,
},
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, default: null, min: 0 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: null, min: 0 },
    usageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

couponSchema.index({ isDeleted: 1, code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
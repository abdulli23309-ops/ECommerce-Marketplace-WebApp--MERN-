import mongoose from 'mongoose';

const deliveryChargeSchema = new mongoose.Schema(
  {
    sellerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      unique: true,
    },
    baseCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    freeAbove: {
      type: Number,
      default: null,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const DeliveryCharge = mongoose.model('DeliveryCharge', deliveryChargeSchema);

export default DeliveryCharge;
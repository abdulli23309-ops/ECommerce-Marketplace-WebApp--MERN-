import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    sellerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    city: {
  type: String,
  trim: true,
  default: null,
},
  },
  { timestamps: true }
);

const Store = mongoose.model('Store', storeSchema);
export default Store;
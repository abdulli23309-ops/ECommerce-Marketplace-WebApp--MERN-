import mongoose from 'mongoose';

const sellerProfileSchema = new mongoose.Schema(
  {
    // Reference to the User document
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,   // Ensures one profile per user
      index: true,
    },

    // Approval status
    isApproved: {
      type: Boolean,
      default: false,
    },

    // When the seller was approved
    approvedAt: {
      type: Date,
      default: null,
    },

    // Which admin approved this seller
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Seller business details
    businessName: {
      type: String,
      trim: true,
      default: null,
    },

    taxId: {
      type: String,
      trim: true,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    address: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,   // Automatically adds createdAt and updatedAt
  }
);

const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);

export default SellerProfile;
import mongoose from 'mongoose';

const sellerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    taxId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    status: {
  type: String,
  enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
  default: 'Pending',
},

    // ---- Priority 5: seller rating moderation state ----
    averageRating: {
      type: Number,
      default: 0,
    },
    lowRatingStatus: {
      type: Boolean,
      default: false,
    },
    warningCount: {
      type: Number,
      default: 0,
    },
    warningHistory: [
      {
        warnedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: {
          type: String,
          default: '',
        },
        warnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);

export default SellerProfile;